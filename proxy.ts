// proxy.ts  ← Next.js 16 convention (replaces middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticatedEdge } from '@/lib/admin-auth-edge'

// ── IP Allowlist ────────────────────────────────────────────────────────────
//
// BEHAVIOUR: This is an ALLOWLIST (permit-list), NOT a blocklist.
//   • Only IPs explicitly listed in ADMIN_ALLOWED_IPS can reach /admin routes.
//   • Any IP not on the list receives a hard 403 Forbidden.
//
// ⚠️  FAIL-OPEN WARNING (security consideration):
//   • If ADMIN_ALLOWED_IPS is empty or unset, ALL IPs are permitted (fail-open).
//   • This is easy to misread as fail-closed ("no IPs configured → block all").
//   • In reality it means: "no restriction configured → allow everyone."
//   • Always set a non-empty ADMIN_ALLOWED_IPS in production to enforce the gate.
//
// EDGE / DEPLOYMENT NOTE:
//   • This function runs at the Next.js edge runtime (proxy.ts = middleware layer).
//   • Changes to ADMIN_ALLOWED_IPS in the Vercel dashboard take effect ONLY after
//     a full redeploy — environment variable edits alone are not sufficient.
//
// DEBUG TIP:
//   • Hit GET /api/debug-ip to see exactly which IP the edge resolves for your
//     request. Compare `resolvedIp` in that response to the parsed list in
//     ADMIN_ALLOWED_IPS to diagnose allowlist mismatches.
// ────────────────────────────────────────────────────────────────────────────
function isIpAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true

  const allowedRaw = process.env.ADMIN_ALLOWED_IPS
  if (!allowedRaw || allowedRaw.trim() === '') return true

  const allowed = allowedRaw.split(',').map(ip => ip.trim()).filter(Boolean)

  const ip =
    request.headers.get('cf-connecting-ip') ||
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

    // ── Dashboard / Profile auth guard ─────────────────────────
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile')) {
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
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
      console.warn(`[proxy] Admin blocked — IP not in allowlist: ${ip}`)
      return new NextResponse('Forbidden: IP not in admin allowlist', {
        status: 403,
        headers: { 'x-admin-block-reason': 'ip-allowlist' },
      })
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
