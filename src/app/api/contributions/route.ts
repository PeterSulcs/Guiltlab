import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchContributions } from '@/lib/gitlabApi';
import { fetchGitHubContributions } from '@/lib/githubApi';

// GET /api/contributions - Get contributions for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user and their instance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { instance: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if we have cached contributions for this date range
    const cachedContributions = await prisma.contribution.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    if (cachedContributions.length > 0) {
      return NextResponse.json(cachedContributions);
    }

    // Fetch fresh contributions based on instance type
    let contributions;
    if (user.instance.type === 'gitlab') {
      contributions = await fetchContributions(
        {
          id: user.instance.id,
          name: user.instance.name,
          baseUrl: user.instance.baseUrl || '',
          token: user.instance.token
        },
        user.instanceUsername,
        startDate,
        endDate
      );
    } else {
      contributions = await fetchGitHubContributions(
        {
          id: user.instance.id,
          name: user.instance.name,
          username: user.instanceUsername,
          token: user.instance.token
        },
        startDate,
        endDate
      );
    }

    // Cache the contributions
    const cachedData = await Promise.all(
      contributions.map(contribution =>
        prisma.contribution.create({
          data: {
            date: new Date(contribution.date),
            count: contribution.count,
            userId
          }
        })
      )
    );

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}

// POST /api/contributions - Create a new contribution
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, count, userId } = body;

    if (!date || !count || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const contribution = await prisma.contribution.create({
      data: {
        date: new Date(date),
        count,
        userId
      }
    });

    return NextResponse.json(contribution);
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
}

// PUT /api/contributions/[id] - Update a contribution
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, date, count, userId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Contribution ID is required' },
        { status: 400 }
      );
    }

    const contribution = await prisma.contribution.update({
      where: { id },
      data: {
        date: new Date(date),
        count,
        userId
      }
    });

    return NextResponse.json(contribution);
  } catch (error) {
    console.error('Error updating contribution:', error);
    return NextResponse.json(
      { error: 'Failed to update contribution' },
      { status: 500 }
    );
  }
}

// DELETE /api/contributions/[id] - Delete a contribution
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Contribution ID is required' },
        { status: 400 }
      );
    }

    await prisma.contribution.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contribution:', error);
    return NextResponse.json(
      { error: 'Failed to delete contribution' },
      { status: 500 }
    );
  }
} 