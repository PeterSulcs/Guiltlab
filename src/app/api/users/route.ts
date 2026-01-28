import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        instance: true,
        contributions: true
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { displayName, username, avatarUrl, email, instanceId, instanceUsername } = body;

    if (!displayName || !username || !instanceId || !instanceUsername) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        displayName,
        username,
        avatarUrl,
        email,
        instanceId,
        instanceUsername
      },
      include: {
        instance: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, displayName, username, avatarUrl, email, instanceId, instanceUsername } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        displayName,
        username,
        avatarUrl,
        email,
        instanceId,
        instanceUsername
      },
      include: {
        instance: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 