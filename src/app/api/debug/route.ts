import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if we can access the tables
    const gitlabInstances = await prisma.gitLabInstance.findMany();
    const teamMembers = await prisma.teamMember.findMany();
    const instanceUsernames = await prisma.instanceUsername.findMany();
    
    return NextResponse.json({
      gitlabInstances: gitlabInstances.length,
      teamMembers: teamMembers.length,
      instanceUsernames: instanceUsernames.length,
      success: true
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    );
  }
} 