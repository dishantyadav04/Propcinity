import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, getAdminSessionValue } from '@/lib/admin-auth'

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/saved', '/compare']
const AUTH_ROUTES = ['/auth/signin', '/auth/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  // ── Admin route guard (cookie-based, no Supabase needed) ──────────────────
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  if (isAdminPage) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)
    const isValid = adminCookie?.value === getAdminSessionValue()
    if (!isValid) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // ── Supabase user session (JWT validation) ────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/saved/:path*',
    '/compare/:path*',
    '/auth/signin',
    '/auth/signup',
    '/admin/:path*',
  ],
}
