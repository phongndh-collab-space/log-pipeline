import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:7003';
    const response = await fetch(`${backendUrl}/api/kafka/retry-stats`, { cache: 'no-store' });
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
