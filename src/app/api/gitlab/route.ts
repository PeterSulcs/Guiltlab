import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { baseUrl, token, endpoint, method = 'GET', params = {}, data = {} } = body;
    
    if (!baseUrl || !token || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const url = `${baseUrl}${endpoint}`;
    
    const response = await axios({
      method,
      url,
      headers: {
        'Private-Token': token,
        'Content-Type': 'application/json'
      },
      params,
      data: method !== 'GET' ? data : undefined
    });
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('Error proxying GitLab request:', error);
    
    const typedError = error as { message: string, response?: { status: number } };
    
    return NextResponse.json(
      { 
        error: 'Failed to make GitLab request',
        message: typedError.message,
        status: typedError.response?.status
      },
      { status: typedError.response?.status || 500 }
    );
  }
} 