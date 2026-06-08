import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Email confirmation handler for manual sign-up.
 *
 * Supabase sends a confirmation email with a link to:
 *   /auth/confirm?token_hash=...&type=signup
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'email' | null
  const next = searchParams.get('next') ?? '/onboarding'

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/auth/error?message=invalid_confirmation_link`)
  }

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/error?message=service_unavailable`)
  }

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    console.error('[auth/confirm] OTP verification failed:', error)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
    )
  }

  const safeNext = next.startsWith('/') ? next : '/onboarding'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
