import { NextRequest, NextResponse } from 'next/server'
import { isRedisConfigured } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const healthToken = process.env.HEALTH_CHECK_TOKEN
  if (healthToken && request.headers.get('x-health-check') === healthToken) {
    return NextResponse.json({
      ok: true,
      ts: Date.now(),
      redisConfigured: isRedisConfigured(),
    })
  }
  return NextResponse.json({ ok: true })
}
