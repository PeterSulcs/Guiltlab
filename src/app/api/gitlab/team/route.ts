import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

// POST /api/gitlab/team
export async function POST(request: Request) {
  try {
    const { instanceId } = await request.json();

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

    // Check for cached team data
    const cachedUsers = await prisma.gitLabUser.findMany({
      where: {
        instanceId,
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    });

    if (cachedUsers.length > 0) {
      return NextResponse.json(cachedUsers);
    }

    // Fetch team data from GitLab API
    const response = await axios.get(`${instance.baseUrl}/api/v4/users`, {
      headers: {
        'PRIVATE-TOKEN': instance.token,
      },
    });

    const teamData = response.data;

    // Update or create users in database
    const users = await Promise.all(
      teamData.map(async (userData: any) => {
        return prisma.gitLabUser.upsert({
          where: {
            id_instanceId: {
              id: userData.id,
              instanceId,
            },
          },
          update: {
            username: userData.username,
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
          create: {
            id: userData.id,
            instanceId,
            username: userData.username,
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
        });
      })
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }
} 