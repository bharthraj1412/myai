import { NextResponse } from 'next/server'

const AGENT_URL = (
  process.env.AG3NT_AGENT_URL ||
  process.env.NEXT_PUBLIC_AG3NT_AGENT_URL ||
  'http://127.0.0.1:18790'
).replace(/\/+$/, '')

export async function GET() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`${AGENT_URL}/health`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    })

    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : { ok: response.ok }

    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'Agent unavailable' }, { status: 503 })
  } finally {
    clearTimeout(timeout)
  }
}
