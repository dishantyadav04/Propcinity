import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Onboarding auth guard ──────────────────────────────────────
  if (pathname.startsWith('/onboarding')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[proxy] Skipping /onboarding auth guard — NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
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

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/signup', request.url))
    }

    return supabaseResponse
  }

  // ── Admin auth guard ───────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    if (!await isAdminAuthenticated(request)) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/onboarding/:path*', '/admin/:path*'],
}
