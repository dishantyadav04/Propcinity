import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE, getAdminSessionValue } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json().catch(() => ({}))

  if (!password || !checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, getAdminSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}
