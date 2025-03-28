import axios from 'axios';
import { ContributionData, GitLabInstance, UserData } from '../types';

// Define a type for GitLab project structure
type GitLabProject = {
  id: number;
  name: string;
};

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
  endDate: string,
  overrideUsername?: string
): Promise<ContributionData[]> {
  try {
    // First get the user ID
    const user = await fetchGitLabUser(instance);
    
    console.log(`Fetching GitLab contributions for ${instance.name} (${overrideUsername || user.username}) from ${startDate} to ${endDate}`);
    
    // For older years, we need to try a different approach since the events API has limitations
    const startYear = new Date(startDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // If date range is not current or last year, try the projects approach for historical data
    if (startYear < lastYear) {
      console.log(`Fetching historical data (${startYear}) using projects approach...`);
      const historicalContributions = await fetchHistoricalContributions(
        instance, 
        user, 
        startDate, 
        endDate,
        overrideUsername
      );
      
      if (historicalContributions.length > 0) {
        console.log(`Successfully retrieved ${historicalContributions.length} historical contribution days`);
        return historicalContributions;
      }
      
      console.log(`No historical data found, falling back to events API...`);
    }
    
    // Fall back to events API for more recent data or if historical approach failed
    return await fetchContributionsViaEvents(instance, user, startDate, endDate, overrideUsername);
  } catch (error) {
    console.error(`Error fetching contributions from ${instance.name}:`, error);
    console.error('Error details:', error);
    
    // Instead of throwing error which breaks the UI,
    // return empty array so the app can continue to function
    return [];
  }
}

// New approach to fetch historical contributions by analyzing project activity
async function fetchHistoricalContributions(
  instance: GitLabInstance,
  user: UserData,
  startDate: string,
  endDate: string,
  overrideUsername?: string
): Promise<ContributionData[]> {
  try {
    // First get all projects the user is a member of
    console.log(`Fetching projects for ${overrideUsername || user.username}...`);
    
    const projects = await fetchUserProjects(instance, user.id);
    console.log(`Found ${projects.length} projects for ${overrideUsername || user.username}`);
    
    if (projects.length === 0) {
      return [];
    }
    
    // Process contributions for each project
    const contributionMap = new Map<string, number>();
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Process only the first 5 projects to avoid rate limiting
    // This is a compromise for historical data
    const projectsToProcess = projects.slice(0, 5);
    
    for (const project of projectsToProcess) {
      const typedProject = project as GitLabProject;
      console.log(`Processing project ${typedProject.name} (${typedProject.id})...`);
      
      try {
        // Get all commits by the user in this project
        const commits = await fetchProjectCommits(
          instance, 
          typedProject.id, 
          overrideUsername || user.username,
          startDate,
          endDate
        );
        
        console.log(`Found ${commits.length} commits in project ${typedProject.name}`);
        
        // Count commits by date
        commits.forEach(commit => {
          const typedCommit = commit as { created_at: string };
          const commitDate = typedCommit.created_at.split('T')[0];
          const date = new Date(commitDate);
          
          // Ensure the date is within our range
          if (date >= startDateObj && date <= endDateObj) {
            contributionMap.set(
              commitDate, 
              (contributionMap.get(commitDate) || 0) + 1
            );
          }
        });
      } catch (error) {
        console.error(`Error processing project ${typedProject.name}:`, error);
        // Continue with other projects
      }
    }
    
    // Convert to ContributionData array
    const contributions: ContributionData[] = Array.from(contributionMap.entries())
      .map(([date, count]) => ({
        date,
        count,
        instanceId: instance.id
      }));
    
    return contributions;
  } catch (error) {
    console.error('Error fetching historical contributions:', error);
    return [];
  }
}

// Function to fetch all projects a user belongs to
async function fetchUserProjects(
  instance: GitLabInstance, 
  userId: string | number
): Promise<unknown[]> {
  try {
    const response = await axios.get(
      `${instance.baseUrl}/api/v4/users/${userId}/projects`,
      {
        headers: {
          'Private-Token': instance.token
        },
        params: {
          per_page: 100 // Maximum allowed by GitLab API
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

// Function to fetch commits for a project by a specific user
async function fetchProjectCommits(
  instance: GitLabInstance,
  projectId: number,
  username: string,
  startDate: string,
  endDate: string
): Promise<unknown[]> {
  try {
    console.log(`Fetching commits for project ${projectId} by user ${username}...`);
    
    // Fetch commits for this project filtered by the specified author (username)
    let allCommits: unknown[] = [];
    let page = 1;
    let hasMoreCommits = true;
    
    // For simplicity, limiting to 3 pages (approx 300 commits)
    while (hasMoreCommits && page <= 3) {
      const response = await axios.get(
        `${instance.baseUrl}/api/v4/projects/${projectId}/repository/commits`,
        {
          headers: {
            'Private-Token': instance.token
          },
          params: {
            since: startDate,
            until: endDate,
            author: username,  // Filter by the author's name or email
            per_page: 100,
            page: page
          }
        }
      );
      
      const commits = response.data;
      
      if (commits.length === 0) {
        hasMoreCommits = false;
      } else {
        allCommits = [...allCommits, ...commits];
        page++;
        
        // If we got fewer than the max per page, we're done
        if (commits.length < 100) {
          hasMoreCommits = false;
        }
      }
    }
    
    console.log(`Found ${allCommits.length} commits for project ${projectId} by user ${username}`);
    return allCommits;
  } catch (error) {
    console.error(`Error fetching commits for project ${projectId}:`, error);
    return [];
  }
}

// Repackaged function to fetch contributions via events API
async function fetchContributionsViaEvents(
  instance: GitLabInstance,
  user: UserData,
  startDate: string,
  endDate: string,
  overrideUsername?: string
): Promise<ContributionData[]> {
  // Parse the dates to determine years involved
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  const yearsToFetch: number[] = [];
  
  // Generate array of years to fetch
  for (let year = startYear; year <= endYear; year++) {
    yearsToFetch.push(year);
  }
  
  console.log(`Need to fetch contributions for years: ${yearsToFetch.join(', ')}`);
  
  // Collection for all contributions across all applicable years
  let allContributions: ContributionData[] = [];
  
  // Process each year separately for better performance
  if (yearsToFetch.length > 0) {
    for (const year of yearsToFetch) {
      console.log(`Processing year ${year} for ${instance.name} using events API...`);
      
      // Calculate the year's date range
      const yearStart = new Date(year, 0, 1).toISOString().split('T')[0];
      const yearEnd = new Date(year, 11, 31).toISOString().split('T')[0];
      
      // The + 1 day is to ensure we include the last day of the range
      const nextDay = new Date(new Date(yearEnd).getTime() + 86400000).toISOString().split('T')[0];
      
      const yearContributions = await fetchContributionsFromEvents(
        instance, 
        user, 
        yearStart, 
        nextDay,
        overrideUsername
      );
      
      console.log(`Total for year ${year}: ${yearContributions.length} contribution days`);
      allContributions = [...allContributions, ...yearContributions];
    }
  } else {
    // Fall back to events API approach for the entire date range
    allContributions = await fetchContributionsFromEvents(instance, user, startDate, endDate, overrideUsername);
  }
  
  // Apply date filtering to ensure we only return contributions within the requested range
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  const filteredContributions = allContributions.filter(contribution => {
    const contributionDate = new Date(contribution.date);
    return contributionDate >= startDateObj && contributionDate <= endDateObj;
  });
  
  console.log(`Final: Found ${filteredContributions.length} contribution days for ${instance.name} from ${startDate} to ${endDate}`);
  console.log(`Total contribution count for ${instance.name}: ${filteredContributions.reduce((sum, c) => sum + c.count, 0)}`);
  
  return filteredContributions;
}

// Fallback method to fetch contributions using the events API
async function fetchContributionsFromEvents(
  instance: GitLabInstance,
  user: UserData,
  startDate: string,
  endDate: string,
  overrideUsername?: string
): Promise<ContributionData[]> {
  // If we have an override username, we need to first get that user's ID
  let targetUserId = user.id;
  
  if (overrideUsername && overrideUsername !== user.username) {
    try {
      console.log(`Looking up user ID for override username: ${overrideUsername}`);
      // First, try to find the user by username
      const userResponse = await axios.get(
        `${instance.baseUrl}/api/v4/users`,
        {
          headers: {
            'Private-Token': instance.token
          },
          params: {
            username: overrideUsername
          }
        }
      );
      
      if (userResponse.data && userResponse.data.length > 0) {
        targetUserId = userResponse.data[0].id;
        console.log(`Found user ID ${targetUserId} for username ${overrideUsername}`);
      } else {
        console.log(`Could not find user ID for username ${overrideUsername}, using authenticated user as fallback`);
      }
    } catch (error) {
      console.error(`Error looking up user ID for ${overrideUsername}:`, error);
      console.log(`Falling back to authenticated user ID: ${user.id}`);
    }
  }
  
  console.log(`Falling back to events API for ${instance.name} from ${startDate} to ${endDate} for user ID: ${targetUserId}`);
  
  // Ensure dates are in the format GitLab expects (YYYY-MM-DD)
  const formattedStartDate = startDate;
  const formattedEndDate = endDate;
  
  // Fetch events data from the GitLab API (with pagination)
  let allEvents: unknown[] = [];
  let page = 1;
  let hasMoreEvents = true;
  let reachedRateLimit = false;
  
  // GitLab counts specific action types as contributions
  // See: https://docs.gitlab.com/ee/user/profile/contributions.html
  const contributionActionTypes = [
    'pushed', 'merged', 'created', 'commented', 'opened'
  ];
  
  console.log(`GitLab API URL: ${instance.baseUrl}/api/v4/users/${targetUserId}/events?after=${formattedStartDate}&before=${formattedEndDate}`);
  
  while (hasMoreEvents && !reachedRateLimit) {
    try {
      const response = await axios.get(
        `${instance.baseUrl}/api/v4/users/${targetUserId}/events`,
        {
          headers: {
            'Private-Token': instance.token
          },
          params: {
            after: formattedStartDate,
            before: formattedEndDate,
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
          console.log(`${instance.name} events for debugging (page ${page}):`, 
                    events.slice(0, 3).map((e: unknown) => {
                      const typedEvent = e as { action_name: string, created_at: string, target_type: string };
                      return {
                        action: typedEvent.action_name,
                        date: typedEvent.created_at.split('T')[0],
                        type: typedEvent.target_type
                      };
                    }));
        }
        
        allEvents = [...allEvents, ...events];
        page++;
        
        // If we got fewer than the max per page, we're done
        if (events.length < 100) {
          hasMoreEvents = false;
        }
        
        // For safety, stop after 10 pages (1000 events)
        if (page > 10) {
          console.log(`Reached maximum page limit (${page}) for ${instance.name}, stopping pagination`);
          hasMoreEvents = false;
        }
      }
    } catch (error: unknown) {
      console.error(`Error fetching events page ${page}:`, (error as { message: string }).message);
      
      // Check if we hit rate limiting
      const typedError = error as { response?: { status: number } };
      if (typedError.response && typedError.response.status === 429) {
        console.log(`Hit rate limit on page ${page}, stopping pagination`);
        reachedRateLimit = true;
      }
      
      // Stop pagination on error
      hasMoreEvents = false;
    }
  }
  
  console.log(`Total events fetched from ${instance.name}: ${allEvents.length}`);
  
  // Process events data into a contribution map
  const contributionMap = new Map<string, number>();

  // Create a date filter for manual verification
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  allEvents.forEach((event: unknown) => {
    try {
      // GitLab returns ISO format dates with timezone, extract just the YYYY-MM-DD
      const typedEvent = event as { created_at?: string, action_name?: string };
      if (!typedEvent.created_at) {
        console.log("Event missing created_at:", event);
        return; // Skip events without dates
      }
      
      const date = typedEvent.created_at.split('T')[0];
      
      // Double-check the date range (GitLab API sometimes ignores the date filters)
      const eventDate = new Date(date);
      if (eventDate >= startDateObj && eventDate <= endDateObj) {
        // Only count specific action types as contributions
        if (contributionActionTypes.includes(typedEvent.action_name || '')) {
          contributionMap.set(date, (contributionMap.get(date) || 0) + 1);
        }
      }
    } catch (err) {
      console.warn("Error processing event:", err);
    }
  });
  
  // Convert map to array of contribution data
  const contributions: ContributionData[] = Array.from(contributionMap.entries())
    .map(([date, count]) => ({
      date,
      count,
      instanceId: instance.id
    }));
  
  return contributions;
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