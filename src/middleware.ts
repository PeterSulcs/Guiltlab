import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clearExpiredCache } from '@/lib/cache';

export async function middleware(request: NextRequest) {
  // Clear expired cache entries on every request
  await clearExpiredCache();
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
