import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/redis'

function createLimiter(requests: number, windowStr: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  const redis = getRedis()
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, windowStr),
    analytics: false,
  })
}

// Per-endpoint limiters
export const aiAskLimiter    = createLimiter(20, '1 h')  // 20 AI questions/hour/IP
export const aiEmbedLimiter  = createLimiter(20, '1 h')  // 20 embedding requests/hour/IP
export const aiRankLimiter   = createLimiter(5, '1 h')   // 5 re-ranks/hour/IP (cached, so rarely hit)
export const leadsLimiter    = createLimiter(10, '1 h')  // 10 lead submissions/hour/IP
export const leadsColdLimiter = createLimiter(10, '1 h') // 10 cold-lead upserts/hour/IP
export const nearbyLimiter   = createLimiter(60, '1 h')  // 60 map lookups/hour/IP
export const adminLoginLimiter = createLimiter(5, '15 m') // 5 login attempts/15min/IP

export function getClientIp(request: Request): string {
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwarded) return vercelForwarded.split(',')[0]?.trim() ?? 'unknown'

  // x-real-ip is set by Vercel/proxies and cannot be spoofed by clients
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // x-forwarded-for: "client, proxy1, proxy2" — prefer the RIGHTMOST entry
  // (the most recent proxy), which is the one Vercel/edge stacks typically preserve
  // for the client-facing address after proxy hops.
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((part) => part.trim()).filter(Boolean)
    return parts[parts.length - 1] ?? 'unknown'
  }

  return 'unknown'
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ limited: boolean; retryAfter?: number }> {
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY] Rate limiter unavailable in production — blocking request')
      return { limited: true }
    }
    console.warn('[rate-limit] Rate limiting disabled in development — allowing request')
    return { limited: false }
  }
  const { success, reset } = await limiter.limit(identifier)
  const retryAfter = reset ? Math.max(0, Math.ceil((reset - Date.now()) / 1000)) : undefined
  return { limited: !success, retryAfter }
}
