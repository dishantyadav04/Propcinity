// proxy.ts  ← Next.js 16 convention (replaces middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedEdge } from '@/lib/admin-auth-edge'

// ── IP Allowlist ───────────────────────────────────────────────
function isIpAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true

  const allowedRaw = process.env.ADMIN_ALLOWED_IPS
  if (!allowedRaw || allowedRaw.trim() === '') return true

  const allowed = allowedRaw.split(',').map(ip => ip.trim()).filter(Boolean)

  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  return allowed.includes(ip)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Determine if this route needs auth checks ─────────────────
  const needsAuth =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/saved')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[proxy] Skipping session refresh — Supabase env vars not set')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  // ── Session refresh (only on routes that actually need auth) ───
  if (needsAuth) {
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

    const { data: { user } } = await supabase.auth.getUser()

    // ── Onboarding auth guard ──────────────────────────────────
    if (pathname.startsWith('/onboarding')) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth/signup', request.url))
      }
      return supabaseResponse
    }
  }

  // ── Admin auth guard (always runs for /admin routes) ─────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return supabaseResponse
    }

    if (!isIpAllowed(request)) {
      const ip =
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
      console.warn(`[proxy] Admin blocked — IP not in allowlist: ${ip}`)
      return new NextResponse('Forbidden', { status: 403 })
    }

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
