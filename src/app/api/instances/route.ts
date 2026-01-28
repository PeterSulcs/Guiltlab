import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GitLabInstance } from '@/types';

// GET /api/instances - Get all instances
export async function GET() {
  try {
    const instances = await prisma.gitLabInstance.findMany({
      select: {
        id: true,
        name: true,
        baseUrl: true,
        // Don't return the token for security
      },
    });
    return NextResponse.json(instances);
  } catch (error: any) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}

// POST /api/instances - Create a new instance
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, baseUrl, token } = body;

    if (!name || !baseUrl || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await prisma.gitLabInstance.create({
      data: {
        name,
        baseUrl,
        token,
      },
      select: {
        id: true,
        name: true,
        baseUrl: true,
        // Don't return the token for security
      },
    });

    return NextResponse.json(instance);
  } catch (error: any) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: 'Failed to create instance' },
      { status: 500 }
    );
  }
}

// PUT /api/instances - Update an instance
export async function PUT(request: Request) {
  try {
    const { id, name, baseUrl, token } = await request.json();

    // Validate required fields
    if (!id || !name || !baseUrl) {
      return NextResponse.json(
        { message: 'ID, name, and baseUrl are required' },
        { status: 400 }
      );
    }

    // Update the instance
    const updatedInstance = await prisma.gitLabInstance.update({
      where: { id },
      data: {
        name,
        baseUrl,
        ...(token ? { token } : {}), // Only update token if provided
      },
      select: {
        id: true,
        name: true,
        baseUrl: true,
        // Don't return the token for security
      },
    });

    return NextResponse.json(updatedInstance);
  } catch (error: any) {
    console.error('Error updating instance:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update instance' },
      { status: 500 }
    );
  }
}

// DELETE /api/instances - Delete an instance
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Instance ID is required' },
        { status: 400 }
      );
    }

    // Delete the instance
    await prisma.gitLabInstance.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Instance deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting instance:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete instance' },
      { status: 500 }
    );
  }
} 