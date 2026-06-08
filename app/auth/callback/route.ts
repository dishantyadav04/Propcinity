import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * OAuth 2.0 PKCE callback handler.
 *
 * Flow:
 *   Google/Apple → Supabase → this route → /dashboard (or ?next=)
 *
 * Supabase provides ?code= query param. We exchange it for a JWT session.
 * The JWT + refresh token are stored in HttpOnly cookies by @supabase/ssr.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[auth/callback] Provider error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?message=missing_auth_code`)
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/error?message=service_unavailable`)
  }

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.session) {
    console.error('[auth/callback] Code exchange failed:', exchangeError)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(exchangeError?.message ?? 'session_failed')}`
    )
  }

  const safeNext = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
