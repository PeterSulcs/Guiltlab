import axios from 'axios';
import { ContributionData, GitLabInstance, UserData } from '../types';

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
      name: response.data.name,
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
  startDate: string, 
  endDate: string
): Promise<ContributionData[]> {
  try {
    // First get the user ID
    const user = await fetchGitLabUser(instance);
    
    // Fetch events data from the GitLab API (with pagination)
    let allEvents: any[] = [];
    let page = 1;
    let hasMoreEvents = true;
    
    // GitLab counts specific action types as contributions
    // See: https://docs.gitlab.com/ee/user/profile/contributions.html
    const contributionActionTypes = [
      'pushed', 'merged', 'created', 'commented', 'opened'
    ];
    
    while (hasMoreEvents) {
      const response = await axios.get(
        `${instance.baseUrl}/api/v4/users/${user.id}/events`,
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
      
      const events = response.data;
      
      if (events.length === 0) {
        hasMoreEvents = false;
      } else {
        // Log the first few events for debugging
        if (page === 1) {
          console.log(`${instance.name} events for debugging:`, 
                     events.slice(0, 3).map((e: any) => ({
                       action: e.action_name,
                       date: e.created_at.split('T')[0],
                       type: e.target_type
                     })));
        }
        
        allEvents = [...allEvents, ...events];
        page++;
        
        // If we got fewer than the max per page, we're done
        if (events.length < 100) {
          hasMoreEvents = false;
        }
      }
    }
    
    console.log(`Total events fetched from ${instance.name}: ${allEvents.length}`);
    
    // Process events data into a contribution map
    // Filter events to match GitLab's contribution counting logic
    const contributionMap = new Map<string, number>();
    
    allEvents.forEach((event: any) => {
      // GitLab returns ISO format dates with timezone, extract just the YYYY-MM-DD
      const date = event.created_at.split('T')[0];
      
      // Only count specific action types as contributions
      if (contributionActionTypes.includes(event.action_name)) {
        contributionMap.set(date, (contributionMap.get(date) || 0) + 1);
      }
    });
    
    // Convert map to array of contribution data
    const contributions: ContributionData[] = Array.from(contributionMap.entries())
      .map(([date, count]) => ({
        date,
        count,
        instanceId: instance.id
      }));
    
    console.log(`Counted contributions for ${instance.name}:`, contributions);
    
    return contributions;
  } catch (error) {
    console.error(`Error fetching contributions from ${instance.name}:`, error);
    throw error;
  }
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