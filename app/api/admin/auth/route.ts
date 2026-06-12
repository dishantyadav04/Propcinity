// app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  checkAdminPassword,
  verifyTotpCode,
  isTotpEnabled,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
  generateSessionToken,
  storeSessionToken,
} from '@/lib/admin-auth'
import { adminLoginLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (await checkRateLimit(adminLoginLimiter, `admin-login:${ip}`)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { password, totpCode } = body

  // Step 1: Password check
  if (!password || !checkAdminPassword(password)) {
    console.warn(`[admin-auth] Failed password attempt from ${ip} at ${new Date().toISOString()}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Step 2: TOTP check (only if ADMIN_TOTP_SECRET is configured)
  if (isTotpEnabled()) {
    if (!totpCode) {
      // Password correct, TOTP required — signal client to show TOTP field
      return NextResponse.json({ requireTotp: true }, { status: 200 })
    }
    if (!verifyTotpCode(String(totpCode))) {
      console.warn(`[admin-auth] Failed TOTP attempt from ${ip} at ${new Date().toISOString()}`)
      return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 401 })
    }
  }

  console.info(`[admin-auth] Successful login from ${ip} at ${new Date().toISOString()}`)

  const token = generateSessionToken()
  await storeSessionToken(token)

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}
