import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

// POST /api/gitlab/user
export async function POST(request: Request) {
  try {
    const { instanceId } = await request.json();

    if (!instanceId) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }

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

    try {
      // Fetch user data from GitLab API
      const response = await axios.get(`${instance.baseUrl}/api/v4/user`, {
        headers: {
          'PRIVATE-TOKEN': instance.token,
        },
      });

      const userData = response.data;

      // First, check if a user with this GitLab ID already exists for this instance
      const existingUser = await prisma.gitLabUser.findFirst({
        where: {
          instanceId,
          // We need to find a way to identify the user without relying on the auto-incrementing id
          // Let's use the username as a unique identifier for this instance
          username: userData.username,
        },
      });

      let user;
      if (existingUser) {
        // Update the existing user
        user = await prisma.gitLabUser.update({
          where: {
            id: existingUser.id,
          },
          data: {
            username: userData.username,
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
        });
      } else {
        // Create a new user
        user = await prisma.gitLabUser.create({
          data: {
            id: userData.id,
            instanceId,
            username: userData.username,
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
        });
      }

      return NextResponse.json(user);
    } catch (apiError) {
      console.error('GitLab API error:', apiError);
      
      if (axios.isAxiosError(apiError)) {
        const status = apiError.response?.status;
        const message = apiError.response?.data?.message || apiError.message;
        
        if (status === 401) {
          return NextResponse.json(
            { error: 'Invalid GitLab API token. Please check your token in the settings.' },
            { status: 401 }
          );
        } else if (status === 404) {
          return NextResponse.json(
            { error: 'GitLab API endpoint not found. Please check the base URL in the settings.' },
            { status: 404 }
          );
        } else {
          return NextResponse.json(
            { error: `GitLab API error: ${message}` },
            { status: status || 500 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch user data from GitLab API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GitLab user API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 