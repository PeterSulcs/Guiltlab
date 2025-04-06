import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

// POST /api/gitlab/user
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

    // Check for cached user data
    const cachedUser = await prisma.gitLabUser.findFirst({
      where: {
        instanceId,
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    });

    if (cachedUser) {
      return NextResponse.json(cachedUser);
    }

    // Fetch user data from GitLab API
    const response = await axios.get(`${instance.baseUrl}/api/v4/user`, {
      headers: {
        'PRIVATE-TOKEN': instance.token,
      },
    });

    const userData = response.data;

    // Update or create user in database
    const user = await prisma.gitLabUser.upsert({
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
} 