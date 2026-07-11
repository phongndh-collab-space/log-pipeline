import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'raw-logs';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';

  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:7003';
    const response = await fetch(
      `${backendUrl}/api/kafka/messages?topic=${encodeURIComponent(topic)}&page=${page}&limit=${limit}`,
      { cache: 'no-store' }
    );
    if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
