import axios from 'axios';
import { ContributionData, GitHubInstance, UserData } from '../types';

// Function to fetch user data from GitHub
export async function fetchGitHubUser(instance: GitHubInstance): Promise<UserData> {
  try {
    const response = await axios.get(`https://api.github.com/users/${instance.username}`, {
      headers: {
        'Authorization': instance.token ? `Bearer ${instance.token}` : '',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    return {
      id: response.data.id,
      username: response.data.login,
      name: response.data.name || response.data.login,
      avatarUrl: response.data.avatar_url,
      email: response.data.email || ''
    };
  } catch (error) {
    console.error(`Error fetching user from GitHub (${instance.name}):`, error);
    throw error;
  }
}

// Function to fetch contributions data from GitHub
export async function fetchGitHubContributions(
  instance: GitHubInstance, 
  startDate: string, 
  endDate: string
): Promise<ContributionData[]> {
  try {
    // GitHub has a specific API endpoint for contribution calendar data
    // We're using their newer GraphQL API to get this data
    const query = `
      query {
        user(login: "${instance.username}") {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await axios.post(
      'https://api.github.com/graphql',
      { query },
      {
        headers: {
          'Authorization': `Bearer ${instance.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Process the response into our contribution data format
    const contributionCalendar = 
      response.data?.data?.user?.contributionsCollection?.contributionCalendar;
      
    if (!contributionCalendar) {
      console.error('Could not find contribution data in GitHub response');
      return [];
    }
    
    const weeks = contributionCalendar.weeks || [];
    
    // Create a map of dates to contribution counts
    const contributions: ContributionData[] = [];
    
    // Filter contributions by date range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        const date = day.date;
        const dayDate = new Date(date);
        
        // Check if the date is within our range
        if (dayDate >= startDateObj && dayDate <= endDateObj) {
          contributions.push({
            date,
            count: day.contributionCount,
            instanceId: instance.id
          });
        }
      }
    }
    
    console.log(`Counted contributions for GitHub (${instance.name}):`, contributions);
    
    return contributions;
  } catch (error) {
    console.error(`Error fetching contributions from GitHub (${instance.name}):`, error);
    throw error;
  }
} 