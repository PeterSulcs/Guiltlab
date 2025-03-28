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
    
    // Fetch events data from the GitLab API
    const response = await axios.get(
      `${instance.baseUrl}/api/v4/users/${user.id}/events`,
      {
        headers: {
          'Private-Token': instance.token
        },
        params: {
          after: startDate,
          before: endDate,
          per_page: 100
        }
      }
    );
    
    // Process events data into a contribution map
    const contributionMap = new Map<string, number>();
    
    response.data.forEach((event: any) => {
      // GitLab returns ISO format dates with timezone, extract just the YYYY-MM-DD
      const date = event.created_at.split('T')[0];
      contributionMap.set(date, (contributionMap.get(date) || 0) + 1);
    });
    
    // Convert map to array of contribution data
    const contributions: ContributionData[] = Array.from(contributionMap.entries())
      .map(([date, count]) => ({
        date,
        count,
        instanceId: instance.id
      }));
    
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