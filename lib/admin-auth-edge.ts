// lib/admin-auth-edge.ts
// Edge Runtime compatible — uses Web Crypto only (no Node.js crypto imports)
// Used exclusively by proxy.ts (middleware). API routes use lib/admin-auth.ts.

import type { NextRequest } from 'next/server'
import { getRedis } from '@/lib/redis'

export const ADMIN_COOKIE_NAME = 'admin_session'

// ── Web Crypto helpers ─────────────────────────────────────────

async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacSha256Hex(key: CryptoKey, data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoded)
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function importHmacKey(rawHex: string): Promise<CryptoKey> {
  const bytes = new Uint8Array(rawHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))
  return globalThis.crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g)
  if (!pairs) return new Uint8Array(0)
  return new Uint8Array(pairs.map(h => parseInt(h, 16)))
}

// Constant-time comparison using XOR — Web Crypto doesn't expose timingSafeEqual
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bytesA = hexToBytes(a)
  const bytesB = hexToBytes(b)
  let diff = 0
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i]
  }
  return diff === 0
}

// ── Token verification ─────────────────────────────────────────
// Must match the token format in lib/admin-auth.ts:
// format: tokenId.timestamp.signature
// signature = HMAC-SHA256(tokenId.timestamp, sha256(ADMIN_PASSWORD))

async function verifyTokenSignature(token: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [tokenId, timestamp, providedSig] = parts

  // Decode base-36 timestamp and check age (7 days, hardcoded for edge-compatibility — no Node imports)
  const ADMIN_COOKIE_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000
  const createdAt = parseInt(timestamp, 36)
  if (isNaN(createdAt) || Date.now() - createdAt > ADMIN_COOKIE_MAX_AGE_MS) return false

  const payload = `${tokenId}.${timestamp}`

  try {
    const keyHex = await sha256Hex(adminPassword)
    const hmacKey = await importHmacKey(keyHex)
    const expectedSig = await hmacSha256Hex(hmacKey, payload)
    return timingSafeEqualHex(providedSig, expectedSig)
  } catch {
    return false
  }
}

// ── Public API ─────────────────────────────────────────────────

export async function isAdminAuthenticatedEdge(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie?.value) return false
  const validSignature = await verifyTokenSignature(cookie.value)
  if (!validSignature) return false

  const redis = getRedis()
  if (!redis) return process.env.NODE_ENV !== 'production'

  const tokenId = cookie.value.split('.')[0]
  const exists = await redis.get(`admin_session:${tokenId}`)
  return exists !== null
}
