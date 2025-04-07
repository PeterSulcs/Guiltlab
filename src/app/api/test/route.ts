import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database access
    const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    
    // Also test model access
    const teamMembers = await prisma.teamMember.findMany();
    const instanceUsernames = await prisma.instanceUsername.findMany();
    
    return NextResponse.json({
      tables: result,
      teamMembers,
      instanceUsernames,
      success: true
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', success: false },
      { status: 500 }
    );
  }
} 