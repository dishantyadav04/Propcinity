import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, deleteSessionToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (cookieValue) {
    await deleteSessionToken(cookieValue)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
