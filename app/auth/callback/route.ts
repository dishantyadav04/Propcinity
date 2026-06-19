import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

  const session = data.session
  const identities = session.user?.identities || []
  const userMeta = session.user?.user_metadata || {}
  const appMeta = session.user?.app_metadata || {}

  // Determine if this is an OAuth sign-in (Google)
  const provider = appMeta?.provider
  const isOAuth = provider === 'google' ||
    identities.some((id: any) => id?.provider === 'google')

  const hasPhone = userMeta?.phone && String(userMeta.phone).trim().length > 0

  const safeNext = next.startsWith('/') ? next : '/dashboard'

  if (isOAuth && !hasPhone) {
    return NextResponse.redirect(`${origin}/auth/phone?next=${encodeURIComponent(safeNext)}`)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
