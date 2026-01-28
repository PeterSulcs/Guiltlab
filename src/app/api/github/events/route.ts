import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Octokit } from '@octokit/rest';

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  actor: {
    id: number;
    login: string;
  };
  repo: {
    id: number;
    name: string;
  };
  payload?: {
    ref_type?: string;
    action?: string;
    [key: string]: any;
  };
}

// POST /api/github/events
export async function POST(request: Request) {
  try {
    const { instanceId, username, startDate, endDate } = await request.json();

    if (!instanceId || !username || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the GitHub instance
    const instance = await prisma.gitHubInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'GitHub instance not found' },
        { status: 404 }
      );
    }

    console.log('Fetching GitHub events for:', {
      username,
      instanceId,
      startDate,
      endDate
    });

    // Initialize GitHub client
    const octokit = new Octokit({
      auth: instance.token
    });

    // Fetch events from GitHub API
    const events: GitHubEvent[] = [];
    let page = 1;
    const per_page = 100;
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    // Try both public and private events endpoints
    const endpoints = [
      'GET /users/{username}/events',
      'GET /users/{username}/events/public'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying GitHub endpoint ${endpoint} for user ${username}`);
        
        // First verify the user exists
        const userResponse = await octokit.request('GET /users/{username}', {
          username: username,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        
        console.log('GitHub user data:', userResponse.data);
        
        const response = await octokit.request(endpoint, {
          username: username,
          per_page,
          page,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        console.log(`${endpoint} response status:`, response.status);
        console.log(`${endpoint} response headers:`, response.headers);
        console.log(`${endpoint} response data length:`, response.data.length);
        
        if (response.data.length > 0) {
          console.log('First event:', JSON.stringify(response.data[0], null, 2));
        } else {
          console.log(`No events found for user ${username} using endpoint ${endpoint}`);
          continue;
        }

        // Process events...
        for (const event of response.data) {
          if (!event.created_at || !event.type || !event.actor || !event.repo) {
            console.log('Skipping event due to missing fields:', event);
            continue;
          }

          const eventDate = new Date(event.created_at);
          if (eventDate >= startDateTime && eventDate <= endDateTime) {
            events.push({
              id: event.id.toString(),
              type: event.type,
              created_at: event.created_at,
              actor: {
                id: event.actor.id,
                login: event.actor.login
              },
              repo: {
                id: event.repo.id,
                name: event.repo.name
              }
            });
          }
        }

        if (events.length > 0) {
          console.log(`Found ${events.length} events for user ${username}`);
          break; // We found events, no need to try other endpoints
        }
      } catch (error: any) {
        console.error(`Error with ${endpoint}:`, error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        if (error.response?.status === 404) {
          console.error(`User ${username} not found or no access to their events`);
        }
        // Continue to try the next endpoint
      }
    }

    if (events.length === 0) {
      console.log(`No events found for user ${username} across all endpoints`);
      return NextResponse.json([]);
    }

    // Store events in database
    for (const event of events) {
      await prisma.gitHubEvent.upsert({
        where: {
          id_instanceId: {
            id: event.id,
            instanceId
          }
        },
        update: {
          created_at: new Date(event.created_at),
          type: event.type,
          actor_id: event.actor.id,
          actor_login: event.actor.login,
          repo_id: event.repo.id,
          repo_name: event.repo.name
        },
        create: {
          id: event.id,
          instanceId,
          created_at: new Date(event.created_at),
          type: event.type,
          actor_id: event.actor.id,
          actor_login: event.actor.login,
          repo_id: event.repo.id,
          repo_name: event.repo.name
        }
      });
    }

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error in GitHub events API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch GitHub events',
        details: error.message
      },
      { status: 500 }
    );
  }
} 