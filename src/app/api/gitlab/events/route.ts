import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

// POST /api/gitlab/events
export async function POST(request: Request) {
  try {
    const { instanceId, userId, startDate, endDate } = await request.json();

    // Get the instance from the database
    const instance = await prisma.gitLabInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Check for cached events data
    const cachedEvents = await prisma.gitLabEvent.findMany({
      where: {
        instanceId,
        author_id: userId,
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    });

    if (cachedEvents.length > 0) {
      return NextResponse.json(cachedEvents);
    }

    // Fetch events data from GitLab API
    const response = await axios.get(`${instance.baseUrl}/api/v4/events`, {
      headers: {
        'PRIVATE-TOKEN': instance.token,
      },
      params: {
        user_id: userId,
        after: startDate,
        before: endDate,
      },
    });

    const eventsData = response.data;

    // Update or create events in database
    const events = await Promise.all(
      eventsData.map(async (eventData: any) => {
        return prisma.gitLabEvent.upsert({
          where: {
            id_instanceId: {
              id: eventData.id,
              instanceId,
            },
          },
          update: {
            created_at: new Date(eventData.created_at),
            action_name: eventData.action_name,
            target_id: eventData.target_id,
            target_type: eventData.target_type,
            author_id: eventData.author_id,
            author_username: eventData.author_username,
            project_id: eventData.project_id,
            project_name: eventData.project_name,
          },
          create: {
            id: eventData.id,
            instanceId,
            created_at: new Date(eventData.created_at),
            action_name: eventData.action_name,
            target_id: eventData.target_id,
            target_type: eventData.target_type,
            author_id: eventData.author_id,
            author_username: eventData.author_username,
            project_id: eventData.project_id,
            project_name: eventData.project_name,
          },
        });
      })
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events data' },
      { status: 500 }
    );
  }
} 