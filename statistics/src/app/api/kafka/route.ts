import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Forward the request to the Go backend service
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:7003';
    const response = await fetch(`${backendUrl}/api/kafka/monitor`, {
      cache: 'no-store', // Always fetch fresh stats
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching kafka stats from backend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch kafka stats from backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
