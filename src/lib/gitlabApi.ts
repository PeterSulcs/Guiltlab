import axios from 'axios';
import { ContributionData, GitLabInstance, UserData } from '../types';

interface GitLabEvent {
  action_name: string;
  created_at: string;
  [key: string]: unknown;
}

// Function to fetch user data from GitLab
export async function fetchGitLabUser(instance: GitLabInstance): Promise<UserData> {
  try {
    const response = await axios.get(`${instance.baseUrl}/api/v4/user`, {
      headers: {
        'Private-Token': instance.token
      }
    });
    
    return {
      id: response.data.id,
      username: response.data.username,
      name: response.data.name || response.data.username,
      avatarUrl: response.data.avatar_url,
      email: response.data.email || ''
    };
  } catch (error) {
    console.error(`Error fetching user from ${instance.name}:`, error);
    throw error;
  }
}

// Function to fetch contributions data from GitLab
export async function fetchContributions(
  instance: GitLabInstance,
  username: string,
  startDate: string,
  endDate: string,
  overrideUsername?: string
): Promise<ContributionData[]> {
  try {
    const targetUsername = overrideUsername || username;
    console.log(`Fetching GitLab contributions for ${targetUsername} from ${startDate} to ${endDate}`);

    // Fetch user events which include all activity
    const events = await fetchEventsData(instance, targetUsername, startDate, endDate);
    const contributions = processEventsToContributions(events, instance.id);
    
    console.log(`Fetched ${contributions.length} contributions via events API for GitLab (${instance.name})`);
    return contributions;
  } catch (error) {
    console.error(`Error fetching contributions from GitLab (${instance.name}):`, error);
    throw error;
  }
}

// Helper function to fetch events data
async function fetchEventsData(
  instance: GitLabInstance,
  username: string,
  startDate: string,
  endDate: string
): Promise<GitLabEvent[]> {
  let allEvents: GitLabEvent[] = [];
  let page = 1;
  let hasMoreEvents = true;

  try {
    // First try to fetch user ID to ensure the user exists
    const userResponse = await axios.get(
      `${instance.baseUrl}/api/v4/users?username=${username}`,
      {
        headers: {
          'Private-Token': instance.token
        }
      }
    );

    if (!userResponse.data || userResponse.data.length === 0) {
      console.warn(`User ${username} not found on ${instance.name}`);
      return [];
    }

    const userId = userResponse.data[0].id;

    while (hasMoreEvents && page <= 5) {
      try {
        const response = await axios.get(
          `${instance.baseUrl}/api/v4/users/${userId}/events`,
          {
            headers: {
              'Private-Token': instance.token
            },
            params: {
              after: startDate,
              before: endDate,
              per_page: 100,
              page: page
            }
          }
        );

        const events = response.data as GitLabEvent[];
        if (events.length === 0) {
          hasMoreEvents = false;
        } else {
          allEvents = [...allEvents, ...events];
          page++;
          if (events.length < 100) {
            hasMoreEvents = false;
          }
        }
      } catch (error) {
        console.error(`Error fetching events page ${page}:`, error);
        hasMoreEvents = false;
      }
    }
  } catch (error) {
    console.error(`Error fetching user data or events for ${username} on ${instance.name}:`, error);
    // Return empty array instead of throwing to allow the app to continue
    return [];
  }

  return allEvents;
}

// Helper function to process events into contributions
function processEventsToContributions(events: GitLabEvent[], instanceId: string): ContributionData[] {
  const contributionMap = new Map<string, number>();
  
  // Define the event types we want to count
  const irrelevantEventTypes: string[] = [
    'created'
  ];
  
  console.log(`Processing ${events.length} GitLab events for contribution counting`);
  
  // Debug log to see what types of events we're getting
  const eventTypes = new Set(events.map(e => e.action_name));
  console.log('Event types found:', Array.from(eventTypes));

  events.forEach(event => {
    if (!event.created_at) {
      console.log('Event missing created_at:', event);
      return;
    }
    
    const actionName = event.action_name;
    
    // Skip events that aren't in our relevant types
    if (irrelevantEventTypes.includes(actionName)) {
      console.log(`Skipping event type: ${actionName}`);
      return;
    }
    
    // Parse the date properly to ensure accuracy
    // GitLab's API returns dates in UTC, but we need to adjust for local time
    const eventDate = new Date(event.created_at);
    
    // Add one day to match GitLab's heatmap
    // This is needed because GitLab's heatmap appears to use a different date calculation
    eventDate.setDate(eventDate.getDate() + 1);
    
    // Extract the date components
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    // Log each event being processed with the parsed date
    console.log(`Processing event: ${date} - ${actionName} (original: ${event.created_at}, adjusted: ${eventDate.toISOString()})`);
    
    // Count every event as one contribution
    const currentCount = contributionMap.get(date) || 0;
    contributionMap.set(date, currentCount + 1);
    console.log(`Added 1 contribution for ${date}, new count: ${currentCount + 1}`);
  });

  // Log the final contribution counts
  console.log('Final contribution counts by date:');
  contributionMap.forEach((count, date) => {
    console.log(`${date}: ${count} contributions`);
  });

  return Array.from(contributionMap.entries())
    .map(([date, count]) => ({
      date,
      count,
      instanceId
    }));
}

// Function to aggregate contributions from multiple GitLab instances
export function aggregateContributions(
  contributionsArray: ContributionData[][]
): Map<string, { count: number, contributions: { instanceId: string, count: number }[] }> {
  const aggregatedMap = new Map<string, { 
    count: number, 
    contributions: { instanceId: string, count: number }[] 
  }>();
  
  contributionsArray.flat().forEach(contribution => {
    const existing = aggregatedMap.get(contribution.date);
    
    if (existing) {
      existing.count += contribution.count;
      existing.contributions.push({
        instanceId: contribution.instanceId,
        count: contribution.count
      });
    } else {
      aggregatedMap.set(contribution.date, {
        count: contribution.count,
        contributions: [{
          instanceId: contribution.instanceId,
          count: contribution.count
        }]
      });
    }
  });
  
  return aggregatedMap;
}
