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

    while (true) {
      try {
        // Use the correct endpoint for fetching user events
        const response = await octokit.request('GET /users/{username}/events', {
          username: username,
          per_page,
          page,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        console.log('GitHub API response status:', response.status);
        console.log('GitHub API response headers:', response.headers);
        console.log('GitHub API response data length:', response.data.length);

        if (response.data.length === 0) {
          break;
        }

        let foundOldEvent = false;

        // Filter events by date and store them in the database
        for (const event of response.data) {
          if (!event.created_at || !event.type || !event.actor || !event.repo) {
            console.log('Skipping event due to missing fields:', event);
            continue;
          }

          const eventDate = new Date(event.created_at);
          
          // If we find an event before our start date, we can stop paginating
          if (eventDate < startDateTime) {
            foundOldEvent = true;
            break;
          }

          if (eventDate >= startDateTime && eventDate <= endDateTime) {
            // Store event in database
            await prisma.gitHubEvent.upsert({
              where: {
                id_instanceId: {
                  id: event.id.toString(),
                  instanceId
                }
              },
              update: {
                created_at: eventDate,
                type: event.type,
                actor_id: event.actor.id,
                actor_login: event.actor.login,
                repo_id: event.repo.id,
                repo_name: event.repo.name
              },
              create: {
                id: event.id.toString(),
                instanceId,
                created_at: eventDate,
                type: event.type,
                actor_id: event.actor.id,
                actor_login: event.actor.login,
                repo_id: event.repo.id,
                repo_name: event.repo.name
              }
            });

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

        // If we found an event before our start date or got less than per_page results, we can stop
        if (foundOldEvent || response.data.length < per_page) {
          break;
        }

        page++;
      } catch (error: any) {
        console.error('Error fetching GitHub events:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        // Return a more descriptive error message
        return NextResponse.json(
          { 
            error: `GitHub API error: ${error.message}`,
            status: error.status || 500,
            details: error.response?.data
          },
          { status: error.status || 500 }
        );
      }
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