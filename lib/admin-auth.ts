import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

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

export function getAdminSessionValue(): string {
  return hash(getAdminPassword())
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie) return false
  // Timing-safe comparison for cookie validation too
  const expected = Buffer.from(getAdminSessionValue(), 'utf8')
  const provided = Buffer.from(cookie.value, 'utf8')
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
