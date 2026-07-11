import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '50';
  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const source = searchParams.get('source') || '';

  try {
    // Forward the request to the Go backend service
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:7003';
    const response = await fetch(`${backendUrl}/api/logs?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&source=${encodeURIComponent(source)}`, {
      cache: 'no-store', // Always fetch fresh logs
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching logs from backend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logs from backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
