/**
 * Next.js API Route — Proxy to Gateway /api/memory/*
 * 
 * Catches all /api/memory/* requests from the UI and proxies them
 * to the Gateway's memory routes.
 */

import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = (
  process.env.AG3NT_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_AG3NT_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  'http://127.0.0.1:18789'
).replace(/\/+$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  try {
    const resolved = await params
    const subpath = resolved.path.join('/');
    const gatewayUrl = `${GATEWAY_URL}/api/memory/${subpath}`;
    
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(gatewayUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Gateway returned ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Gateway might be offline — return empty data gracefully
    return NextResponse.json(
      { error: 'Gateway unavailable', fallback: true },
      { status: 503 }
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
