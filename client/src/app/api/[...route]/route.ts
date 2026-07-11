import { NextRequest, NextResponse } from "next/server";

const SERVER_API_URL = process.env.SERVER_API_URL ?? "http://localhost:7002/api";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ route: string[] }> },
) {
  const { route } = await context.params;
  const targetUrl = new URL(`${SERVER_API_URL}/${route.join("/")}`);
  targetUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text(),
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
