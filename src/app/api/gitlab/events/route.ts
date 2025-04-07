import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGitLabClient } from '@/lib/gitlab';

// POST /api/gitlab/events
export async function POST(request: Request) {
  try {
    const { instanceId, username, startDate, endDate } = await request.json();

    if (!instanceId || !username || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the GitLab instance
    const instance = await prisma.gitLabInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'GitLab instance not found' },
        { status: 404 }
      );
    }

    // Initialize GitLab client
    const gitlab = getGitLabClient(instance.baseUrl, instance.token);

    // First, get the user ID from the username
    const userResponse = await gitlab.get(`/users`, {
      params: {
        username: username
      }
    });

    if (!userResponse.data || userResponse.data.length === 0) {
      return NextResponse.json(
        { error: `User ${username} not found` },
        { status: 404 }
      );
    }

    const userId = userResponse.data[0].id;

    // Fetch events from GitLab API
    const response = await gitlab.get(`/users/${userId}/events`, {
      params: {
        after: startDate,
        before: endDate,
        per_page: 100
      }
    });

    const eventsData = response.data;
    // Update or create events in database
    const events = await Promise.all(
      eventsData.map(async (eventData: any) => {
        // Skip events with null target_id
        if (eventData.target_id === null) {
          return null;
        }
        
        return prisma.gitLabEvent.upsert({
          where: {
            id_instanceId: {
              id: eventData.id,
              instanceId: instanceId
            }
          },
          update: {
            created_at: new Date(eventData.created_at),
            action_name: eventData.action_name,
            target_id: eventData.target_id,
            target_type: eventData.target_type,
            author_id: eventData.author_id,
            author_username: eventData.author_username,
            project_id: eventData.project_id,
            project_name: eventData.project_name || ''
          },
          create: {
            id: eventData.id,
            created_at: new Date(eventData.created_at),
            action_name: eventData.action_name,
            target_id: eventData.target_id,
            target_type: eventData.target_type,
            author_id: eventData.author_id,
            author_username: eventData.author_username,
            project_id: eventData.project_id,
            project_name: eventData.project_name || '',
            instance: {
              connect: {
                id: instanceId
              }
            }
          }
        });
      })
    );

    // Filter out null values from skipped events
    const filteredEvents = events.filter(event => event !== null);

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching GitLab events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitLab events' },
      { status: 500 }
    );
  }
} 