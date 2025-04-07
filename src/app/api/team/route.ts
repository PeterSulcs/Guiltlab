import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

// Create a new PrismaClient instance
const prismaClient = new PrismaClient();

// GET /api/team - Get all team members
export async function GET() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      include: {
        instanceUsernames: true
      }
    });
    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team member
export async function POST(request: Request) {
  try {
    const { displayName, instanceUsernames } = await request.json();

    if (!displayName || !instanceUsernames || instanceUsernames.length === 0) {
      return NextResponse.json(
        { error: 'Display name and at least one instance username are required' },
        { status: 400 }
      );
    }

    // Log the request data for debugging
    console.log('Creating team member with data:', { displayName, instanceUsernames });

    // Create the team member with nested instance usernames
    const teamMember = await prisma.teamMember.create({
      data: {
        displayName,
        instanceUsernames: {
          create: instanceUsernames.map(iu => ({
            instanceId: iu.instanceId,
            username: iu.username,
            instanceType: iu.instanceType
          }))
        }
      },
      include: {
        instanceUsernames: true
      }
    });

    console.log('Created team member:', teamMember);
    return NextResponse.json(teamMember);
  } catch (error) {
    // Log the full error for debugging
    console.error('Error creating team member:', error);
    
    // Return more detailed error information
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create team member: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to create team member: Unknown error' },
        { status: 500 }
      );
    }
  }
}

// PUT /api/team - Update a team member
export async function PUT(request: Request) {
  try {
    const { id, displayName, instanceUsernames } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    // Update the team member and instance usernames in a transaction
    const teamMember = await prisma.$transaction(async (tx) => {
      // First delete all existing instance usernames
      await tx.instanceUsername.deleteMany({
        where: { teamMemberId: id }
      });

      // Then update the team member and create new instance usernames
      const member = await tx.teamMember.update({
        where: { id },
        data: {
          displayName,
          instanceUsernames: {
            createMany: {
              data: instanceUsernames.map(iu => ({
                instanceId: iu.instanceId,
                username: iu.username,
                instanceType: iu.instanceType
              }))
            }
          }
        },
        include: {
          instanceUsernames: true
        }
      });

      return member;
    });

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/team - Delete a team member
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    // Delete the team member (instance usernames will be cascade deleted)
    await prisma.teamMember.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
} 