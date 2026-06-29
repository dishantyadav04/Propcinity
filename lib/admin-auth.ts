// lib/admin-auth.ts
import { createHash, timingSafeEqual, createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import * as OTPAuth from 'otpauth'
import { getRedis } from '@/lib/redis'

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
  if (!secretStr) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[admin-auth] CRITICAL: ADMIN_TOTP_SECRET is not set in production. Login blocked for safety.')
      return false // Block login in production if TOTP secret is missing
    }
    console.warn('[admin-auth] ADMIN_TOTP_SECRET not set — TOTP skipped (dev mode only).')
    return true // Allow in dev/staging without TOTP
  }

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

export async function storeSessionToken(token: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.warn('[admin-auth] Redis not configured — session stored in cookie only')
    return
  }
  const tokenId = extractTokenId(token)
  try {
    await redis.set(`admin_session:${tokenId}`, '1', { ex: ADMIN_COOKIE_MAX_AGE })
    console.log('[admin-auth] Session token stored in Redis successfully:', tokenId)
  } catch (e) {
    console.error('[admin-auth] Redis storeSessionToken failed:', e)
  }
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!verifyTokenSignature(token)) return false

  const redis = getRedis()
  if (!redis) {
    // Redis not configured — HMAC signature is the sole auth check
    console.warn('[admin-auth] Redis not configured — using HMAC-only verification')
    return true
  }

  const tokenId = extractTokenId(token)
  try {
    const exists = await redis.get(`admin_session:${tokenId}`)
    if (exists === null) {
      console.warn('[admin-auth] Session token not found in Redis:', tokenId)
      return false
    }
    return true
  } catch (e) {
    // Redis unreachable — fail closed in production to prevent revoked sessions from being accepted
    console.error('[admin-auth] Redis verifySessionToken failed — blocking access:', e)
    if (process.env.NODE_ENV === 'production') return false
    console.warn('[admin-auth] Dev mode: falling back to HMAC-only (not safe for production)')
    return true
  }
}

export async function deleteSessionToken(token: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  const tokenId = extractTokenId(token)
  try {
    await redis.del(`admin_session:${tokenId}`)
    console.log('[admin-auth] Session token deleted from Redis:', tokenId)
  } catch (e) {
    console.error('[admin-auth] Redis deleteSessionToken failed:', e)
  }
}

export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie?.value) return false
  return verifySessionToken(cookie.value)
}
