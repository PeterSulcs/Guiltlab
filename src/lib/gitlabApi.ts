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
    const events = await fetchEventsData(instance, new Date(startDate), new Date(endDate));
    const contributions = processEventsToContributions(events, instance.id);
    
    console.log(`Fetched ${contributions.length} contributions via events API for GitLab (${instance.name})`);
    return contributions;
  } catch (error) {
    console.error(`Error fetching contributions from GitLab (${instance.name}):`, error);
    throw error;
  }
}

// Helper function to fetch events data
export async function fetchEventsData(instance: GitLabInstance, startDate: Date, endDate: Date): Promise<GitLabEvent[]> {
  const response = await fetch('/api/gitlab/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instanceId: instance.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch events data');
  }

  return response.json();
}

// Helper function to process events into contributions
export function processEventsToContributions(events: GitLabEvent[], instanceId: string): ContributionData[] {
  const contributionsByDate = new Map<string, number>();
  
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
    
    // Use the date string directly from the API, taking just the YYYY-MM-DD part
    const date = event.created_at.split('T')[0];
    
    // Log each event being processed with detailed activity information
    console.log(`Processing event: ${date} - Type: ${actionName} - Action: ${event.action_name} - Target Type: ${event.target_type || 'N/A'} - Original timestamp: ${event.created_at}`);
    
    // Count every event as one contribution
    const currentCount = contributionsByDate.get(date) || 0;
    contributionsByDate.set(date, currentCount + 1);
    console.log(`Added 1 contribution for ${date}, new count: ${currentCount + 1}`);
  });

  // Log the final contribution counts
  console.log('Final contribution counts by date:');
  contributionsByDate.forEach((count, date) => {
    console.log(`${date}: ${count} contributions`);
  });

  return Array.from(contributionsByDate.entries())
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

export async function fetchUserData(instance: GitLabInstance): Promise<any> {
  const response = await fetch('/api/gitlab/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instanceId: instance.id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user data');
  }

  return response.json();
}

export async function fetchTeamData(instance: GitLabInstance): Promise<any[]> {
  const response = await fetch('/api/gitlab/team', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instanceId: instance.id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch team data');
  }

  return response.json();
}
