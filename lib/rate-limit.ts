import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

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
export const leadsLimiter    = createLimiter(10, '1 h')  // 10 lead submissions/hour/IP
export const nearbyLimiter   = createLimiter(60, '1 h')  // 60 map lookups/hour/IP
export const adminLoginLimiter = createLimiter(5, '15 m') // 5 login attempts/15min/IP

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }
  return 'unknown'
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<boolean> {
  if (!limiter) return false // If Redis not configured, don't block (fail open for now)
  const { success } = await limiter.limit(identifier)
  return !success // returns true if rate limited
}
