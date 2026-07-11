import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'clickhouse';
  const startTime = searchParams.get('start_time') || '';
  const endTime = searchParams.get('end_time') || '';

  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:7003';
    const params = new URLSearchParams({ source });
    if (startTime) params.set('start_time', startTime);
    if (endTime) params.set('end_time', endTime);

    const response = await fetch(`${backendUrl}/api/logs/analytics?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error fetching analytics from backend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics from backend server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
