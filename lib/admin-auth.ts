import { createHash } from 'crypto'
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
  return hash(password) === hash(getAdminPassword())
}

export function getAdminSessionValue(): string {
  return hash(getAdminPassword())
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)
  if (!cookie) return false
  return cookie.value === getAdminSessionValue()
}
