/**
 * Next.js API Route — Proxy to Gateway /api/memory/*
 * 
 * Catches all /api/memory/* requests from the UI and proxies them
 * to the Gateway's memory routes.
 */

import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:18789';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const subpath = params.path.join('/');
    const gatewayUrl = `${GATEWAY_URL}/api/memory/${subpath}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(gatewayUrl, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
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
  }
}
