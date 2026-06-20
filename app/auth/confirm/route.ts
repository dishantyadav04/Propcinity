import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Email confirmation handler — supports both Supabase link modes:
 *
 *   PKCE mode (current default):  /auth/confirm?code=<uuid>
 *   OTP  mode (legacy):           /auth/confirm?token_hash=<hash>&type=signup
 *
 * Supabase sends ?code= by default. The old route only handled ?token_hash=
 * which caused every confirmation to fail with invalid_confirmation_link.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') as 'signup' | 'email' | null
  const next      = searchParams.get('next') ?? '/onboarding'
  const safeNext  = next.startsWith('/') ? next : '/onboarding'

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/error?message=service_unavailable`)
  }

  // ── Path A: PKCE code exchange (?code=) — what Supabase currently sends ────
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      console.error('[auth/confirm] PKCE code exchange failed:', error)
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(error?.message ?? 'session_failed')}`
      )
    }

    await writePhoneToProfile(supabase, data.session.user)
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  // ── Path B: OTP token_hash (?token_hash=&type=) — fallback ─────────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (error) {
      console.error('[auth/confirm] OTP verification failed:', error)
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) await writePhoneToProfile(supabase, user)
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  // ── Neither param present ───────────────────────────────────────────────────
  console.error('[auth/confirm] No code or token_hash in request:', request.url)
  return NextResponse.redirect(`${origin}/auth/error?message=invalid_confirmation_link`)
}

// ─── Helper: write phone from signup metadata → user_profiles ─────────────────

async function writePhoneToProfile(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  user: { id: string; user_metadata?: Record<string, unknown> }
) {
  const phone = user.user_metadata?.phone as string | undefined
  if (!phone) return

  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { id: user.id, phone, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('[auth/confirm] Failed to write phone to user_profiles:', error)
  }
}
