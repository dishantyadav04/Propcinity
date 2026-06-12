// lib/admin-auth.ts
import { createHash, timingSafeEqual, createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import * as OTPAuth from 'otpauth'

export const ADMIN_COOKIE_NAME = 'admin_session'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// ── Helpers ────────────────────────────────────────────────────

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD environment variable is not set')
  return password
}

// ── Password check ─────────────────────────────────────────────

export function checkAdminPassword(password: string): boolean {
  const expected = Buffer.from(hash(getAdminPassword()), 'hex')
  const provided = Buffer.from(hash(password), 'hex')
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

// ── TOTP ───────────────────────────────────────────────────────
// Uses TOTP (RFC 6238) — compatible with Google Authenticator, Authy, 1Password
//
// Setup (one-time, run in a local script or Node REPL):
//   import * as OTPAuth from 'otpauth'
//   const secret = new OTPAuth.Secret({ size: 20 })
//   console.log(secret.base32)   // → paste into ADMIN_TOTP_SECRET in .env.local
//
// Then scan the QR code (or manually enter the secret) in your authenticator app.
// Use the generateTotpQrUrl() helper below to get the otpauth:// URI for QR generation.

function getTotpSecret(): string | null {
  return process.env.ADMIN_TOTP_SECRET || null
}

export function isTotpEnabled(): boolean {
  return !!getTotpSecret()
}

export function verifyTotpCode(code: string): boolean {
  const secretStr = getTotpSecret()
  if (!secretStr) return true // TOTP not configured — skip check (degraded mode)

  const totp = new OTPAuth.TOTP({
    issuer: 'Propcinity',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretStr),
  })

  // delta: ±1 window (±30s) to account for clock skew
  const delta = totp.validate({ token: code.replace(/\s/g, ''), window: 1 })
  return delta !== null
}

// Returns the otpauth:// URI — paste into a QR code generator to set up your authenticator
export function generateTotpQrUrl(): string | null {
  const secretStr = getTotpSecret()
  if (!secretStr) return null

  const totp = new OTPAuth.TOTP({
    issuer: 'Propcinity',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretStr),
  })

  return totp.toString()
}

// ── HMAC session tokens ────────────────────────────────────────
// Token format: tokenId.timestamp.signature
// No Redis needed for verification. Redis used only for revocation.

function getSigningKey(): Buffer {
  return Buffer.from(hash(getAdminPassword()), 'hex')
}

export function generateSessionToken(): string {
  const tokenId = crypto.randomUUID()
  const timestamp = Date.now().toString(36)
  const payload = `${tokenId}.${timestamp}`
  const signature = createHmac('sha256', getSigningKey()).update(payload).digest('hex')
  return `${payload}.${signature}`
}

function verifyTokenSignature(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const payload = `${parts[0]}.${parts[1]}`
  const expectedSig = createHmac('sha256', getSigningKey()).update(payload).digest('hex')
  return timingSafeEqual(Buffer.from(parts[2], 'hex'), Buffer.from(expectedSig, 'hex'))
}

export function extractTokenId(token: string): string {
  return token.split('.')[0] || ''
}

// ── Redis — optional, for token revocation ─────────────────────

let redisClient: Redis | null = null

function getRedis(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisClient = new Redis({ url, token })
  return redisClient
}

export async function storeSessionToken(token: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    const tokenId = extractTokenId(token)
    await redis.set(`admin_session:${tokenId}`, '1', { ex: ADMIN_COOKIE_MAX_AGE }).catch(() => {})
  }
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!verifyTokenSignature(token)) return false

  const redis = getRedis()
  if (redis) {
    const tokenId = extractTokenId(token)
    try {
      const exists = await redis.get(`admin_session:${tokenId}`)
      if (exists === null) return false
    } catch {
      // Redis unreachable — fall through to HMAC-only
    }
  }

  return true
}

export async function deleteSessionToken(token: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    const tokenId = extractTokenId(token)
    await redis.del(`admin_session:${tokenId}`).catch(() => {})
  }
}

export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie?.value) return false
  return verifySessionToken(cookie.value)
}
