import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGitLabClient } from '@/lib/gitlab';
import { AxiosError } from 'axios';

interface GitLabErrorResponse {
  message?: string;
}

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

    try {
      // Initialize GitLab client
      const gitlab = getGitLabClient(instance.baseUrl, instance.token);

      // Fetch user data from GitLab API
      const response = await gitlab.get('/user');
      const userData = response.data;

      return NextResponse.json({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
      });
    } catch (error) {
      console.error('GitLab API error:', error);
      
      const axiosError = error as AxiosError<GitLabErrorResponse>;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || axiosError.message;
        
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