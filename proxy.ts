// proxy.ts  ← Next.js 16 convention (replaces middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedEdge } from '@/lib/admin-auth-edge'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname: earlyPathname } = request.nextUrl

  if (earlyPathname.startsWith('/admin')) {
    const isAdminRoute = earlyPathname === '/admin/login' || earlyPathname.startsWith('/admin/login/')
    if (!isAdminRoute) {
      const isAdminAuthenticated = await isAdminAuthenticatedEdge(request)
      if (!isAdminAuthenticated) {
        const loginUrl = new URL('/admin/login', request.url)
        loginUrl.searchParams.set('from', earlyPathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[proxy] Supabase env vars not set')
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Determine auth state by validating the session against Supabase
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 1. Redirect signed-in users away from the marketing landing page (/) to the dashboard
  if (pathname === '/') {
    if (user) {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
      // Transfer any refreshed Supabase cookies to the redirect response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
          domain: cookie.domain,
          maxAge: cookie.maxAge,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          httpOnly: cookie.httpOnly,
        })
      })
      return redirectResponse
    }
  }

  // 2. Redirect signed-out users from protected routes to the sign-in page, preserving the redirect target
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/saved')

  if (isProtectedRoute) {
    if (!user) {
      const signinUrl = new URL('/auth/signin', request.url)
      signinUrl.searchParams.set('next', pathname)
      const redirectResponse = NextResponse.redirect(signinUrl)
      // Transfer any refreshed Supabase cookies to the redirect response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
          domain: cookie.domain,
          maxAge: cookie.maxAge,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          httpOnly: cookie.httpOnly,
        })
      })
      return redirectResponse
    }
  }

  return supabaseResponse
}

// Strictly scope the proxy (middleware) to match only the target routes to avoid performance overhead
export const config = {
  matcher: ['/', '/dashboard/:path*', '/profile/:path*', '/saved/:path*', '/admin/:path*'],
}
