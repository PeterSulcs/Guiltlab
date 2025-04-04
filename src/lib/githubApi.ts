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
  endDate: string,
  overrideUsername?: string
): Promise<ContributionData[]> {
  try {
    // Use overrideUsername if provided, otherwise use instance username
    const username = overrideUsername || instance.username;
    
    // GitHub's GraphQL API requires specific date formatting to fetch historical contributions
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    
    console.log(`Fetching GitHub contributions for ${username} from ${startDate} to ${endDate} (${startYear}-${endYear})`);
    
    // Build a query that specifically requests the contribution collection for the time period
    const query = `
      query {
        user(login: "${username}") {
          contributionsCollection(
            from: "${startDate}T00:00:00Z",
            to: "${endDate}T23:59:59Z"
          ) {
            contributionCalendar {
              totalContributions
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
    
    // Debug response to see what GitHub is returning
    console.log('GitHub API response:', JSON.stringify(response.data, null, 2));
    
    // Process the response into our contribution data format
    const contributionCalendar = 
      response.data?.data?.user?.contributionsCollection?.contributionCalendar;
      
    if (!contributionCalendar) {
      console.error('Could not find contribution data in GitHub response');
      return [];
    }
    
    console.log(`Total contributions from GitHub for ${instance.name}: ${contributionCalendar.totalContributions}`);
    
    const weeks = contributionCalendar.weeks || [];
    
    // Create an array of contributions
    const contributions: ContributionData[] = [];
    
    // Process contributions - no need to filter further since we already specified the date range in the query
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        const date = day.date;
        const count = day.contributionCount;
        
        if (count > 0) {
          // Adjust the date by adding one day to match GitLab's heatmap
          const dateObj = new Date(date);
          dateObj.setDate(dateObj.getDate() + 1);
          const adjustedDate = dateObj.toISOString().split('T')[0];
          
          contributions.push({
            date: adjustedDate,
            count,
            instanceId: instance.id
          });
        }
      }
    }
    
    console.log(`Fetched ${contributions.length} contributions for GitHub (${instance.name})`);
    
    return contributions;
  } catch (error) {
    console.error(`Error fetching contributions from GitHub (${instance.name}):`, error);
    console.error('Error details:', error);
    throw error;
  }
} 