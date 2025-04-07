import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/github/instances - Get all GitHub instances
export async function GET() {
  try {
    const instances = await prisma.gitHubInstance.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        token: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(instances);
  } catch (error) {
    console.error('Error fetching GitHub instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub instances' },
      { status: 500 }
    );
  }
}

// POST /api/github/instances - Create a new GitHub instance
export async function POST(request: Request) {
  try {
    const { name, username, token } = await request.json();

    if (!name || !username || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await prisma.gitHubInstance.create({
      data: {
        name,
        username,
        token,
      },
    });

    return NextResponse.json(instance);
  } catch (error) {
    console.error('Error creating GitHub instance:', error);
    return NextResponse.json(
      { error: 'Failed to create GitHub instance' },
      { status: 500 }
    );
  }
}

// PUT /api/github/instances - Update a GitHub instance
export async function PUT(request: Request) {
  try {
    const { id, name, username, token } = await request.json();

    if (!id || !name || !username || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await prisma.gitHubInstance.update({
      where: { id },
      data: {
        name,
        username,
        token,
      },
    });

    return NextResponse.json(instance);
  } catch (error) {
    console.error('Error updating GitHub instance:', error);
    return NextResponse.json(
      { error: 'Failed to update GitHub instance' },
      { status: 500 }
    );
  }
}

// DELETE /api/github/instances - Delete a GitHub instance
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Instance ID is required' },
        { status: 400 }
      );
    }

    await prisma.gitHubInstance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting GitHub instance:', error);
    return NextResponse.json(
      { error: 'Failed to delete GitHub instance' },
      { status: 500 }
    );
  }
} 