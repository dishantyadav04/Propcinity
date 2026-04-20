import { createHash } from 'crypto'
import { NextRequest } from 'next/server'

export const ADMIN_COOKIE_NAME = 'admin_session'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function checkAdminPassword(password: string): boolean {
  return hash(password) === hash(process.env.ADMIN_PASSWORD!)
}

export function getAdminSessionValue(): string {
  return hash(process.env.ADMIN_PASSWORD!)
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie) return false
  return cookie.value === getAdminSessionValue()
}
