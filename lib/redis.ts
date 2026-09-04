import { Redis } from '@upstash/redis'

let _redis: Redis | null = null
let _warnedMissingConfig = false

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    // Log once per cold start, not once per call — this runs on every
    // cache-aside read otherwise and would flood the logs.
    if (!_warnedMissingConfig) {
      _warnedMissingConfig = true
      console.warn(
        '[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — server-cache, nearby-place cache, and admin session revocation are all running without Redis. This fails open (slower, not insecure) but silently, so verify this is intentional for this environment.'
      )
    }
    return null
  }
  _redis = new Redis({ url, token })
  return _redis
}
