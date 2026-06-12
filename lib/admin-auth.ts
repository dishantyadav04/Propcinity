import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

export const ADMIN_COOKIE_NAME = 'admin_session'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is not set')
  }
  return password
}

export function checkAdminPassword(password: string): boolean {
  const expected = Buffer.from(hash(getAdminPassword()), 'hex')
  const provided = Buffer.from(hash(password), 'hex')
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

// ── Random session token management ────────────────────────────

let redisClient: Redis | null = null

function getRedis(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisClient = new Redis({ url, token })
  return redisClient
}

const sessionFallback = new Set<string>()

export function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36)
}

export async function storeSessionToken(token: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.set(`admin_session:${token}`, '1', { ex: ADMIN_COOKIE_MAX_AGE })
    return
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY] Admin session: Redis unavailable in production — falling back to in-memory storage')
  } else {
    console.warn('[admin-auth] Redis not configured — using in-memory session fallback for dev')
  }
  sessionFallback.add(token)
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const redis = getRedis()
  if (redis) {
    const exists = await redis.get(`admin_session:${token}`)
    return exists !== null
  }
  return sessionFallback.has(token)
}

export async function deleteSessionToken(token: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.del(`admin_session:${token}`)
    return
  }
  sessionFallback.delete(token)
}

export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie?.value) return false
  return verifySessionToken(cookie.value)
}
