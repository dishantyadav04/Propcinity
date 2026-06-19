// proxy.ts  ← Next.js 16 convention (replaces middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedEdge } from '@/lib/admin-auth-edge'

// ── IP Allowlist ───────────────────────────────────────────────
// Set ADMIN_ALLOWED_IPS in .env.local as comma-separated IPs.
// In development, the check is skipped entirely (dev IP is ::1 / 127.0.0.1).
// In production, leave empty to allow all IPs, or set specific IPs to restrict.
// Example: ADMIN_ALLOWED_IPS=203.0.113.42,198.51.100.7

function isIpAllowed(request: NextRequest): boolean {
  // Always allow in development — dev server uses ::1 (IPv6 localhost)
  if (process.env.NODE_ENV !== 'production') return true

  const allowedRaw = process.env.ADMIN_ALLOWED_IPS
  if (!allowedRaw || allowedRaw.trim() === '') return true // no restriction

  const allowed = allowedRaw.split(',').map(ip => ip.trim()).filter(Boolean)

  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  return allowed.includes(ip)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Global session refresh ──────────────────────────────────────
  // Run on every request to keep Supabase auth tokens fresh.
  // Without this, the server-side client sees stale cookies and
  // throws "Refresh Token Not Found" when any route handler or
  // server component tries to read the session.

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[proxy] Skipping session refresh — Supabase env vars not set')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session by validating the current user.
  // Supabase internally rotates the refresh token if needed and writes
  // the updated cookies via setAll() above.
  const { data: { user } } = await supabase.auth.getUser()

  // ── Onboarding auth guard ──────────────────────────────────────
  if (pathname.startsWith('/onboarding')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signup', request.url))
    }

    return supabaseResponse
  }

  // ── Admin auth guard ───────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Always allow the login page itself
    if (pathname === '/admin/login') {
      return supabaseResponse
    }

    // Step 1: IP allowlist (production only — dev always passes)
    if (!isIpAllowed(request)) {
      const ip =
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
      console.warn(`[proxy] Admin blocked — IP not in allowlist: ${ip}`)
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Step 2: Session cookie check (edge-safe HMAC verification)
    if (!await isAdminAuthenticatedEdge(request)) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
