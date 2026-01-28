import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/instances/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, baseUrl, token } = body;

    if (!name || !baseUrl || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await prisma.gitLabInstance.update({
      where: { id: params.id },
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
  } catch (error) {
    console.error('Error updating instance:', error);
    return NextResponse.json(
      { error: 'Failed to update instance' },
      { status: 500 }
    );
  }
}

// DELETE /api/instances/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.gitLabInstance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return NextResponse.json(
      { error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
} 