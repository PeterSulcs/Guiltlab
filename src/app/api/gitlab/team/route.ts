import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGitLabClient } from '@/lib/gitlab';

// POST /api/gitlab/team
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

    // Get team members from database
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        instanceUsernames: {
          some: {
            instanceId,
            instanceType: 'gitlab'
          }
        }
      },
      include: {
        instanceUsernames: true
      }
    });

    // Initialize GitLab client
    const gitlab = getGitLabClient(instance.baseUrl, instance.token);

    // Fetch user data for each team member
    const usersWithData = await Promise.all(
      teamMembers.map(async (member) => {
        const instanceUsername = member.instanceUsernames.find(
          (iu) => iu.instanceId === instanceId && iu.instanceType === 'gitlab'
        )?.username;

        if (!instanceUsername) {
          return null;
        }

        try {
          // Fetch user data from GitLab API
          const response = await gitlab.get(`/users`, {
            params: {
              username: instanceUsername
            }
          });

          if (response.data.length === 0) {
            return null;
          }

          const userData = response.data[0];
          return {
            id: userData.id,
            username: userData.username,
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
            displayName: member.displayName,
            teamMemberId: member.id
          };
        } catch (error) {
          console.error(`Error fetching user data for ${instanceUsername}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and return the users
    const validUsers = usersWithData.filter(user => user !== null);
    return NextResponse.json(validUsers);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }
} 