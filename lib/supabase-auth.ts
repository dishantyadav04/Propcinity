'use client'

import { createClient } from '@/lib/supabase'

// ─── OAuth 2.0 (Google) ───────────────────────────────────────────────────────

/**
 * Initiates Google OAuth 2.0 PKCE flow.
 * Browser is redirected to Google → returns to /auth/callback.
 * @param redirectAfter  Path to land on after successful auth (default: /dashboard)
 */
export async function signInWithGoogle(redirectAfter = '/dashboard') {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfter)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw new Error(error.message)
}

// ─── Update Phone ─────────────────────────────────────────────────────────────

/**
 * Updates the user's phone number in their profile metadata.
 */
export async function updateUserPhone(phone: string) {
  const supabase = createClient()
  const formattedPhone = phone ? `+91${phone.replace(/\D/g, '').slice(0, 10)}` : ''

  // Write to auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { phone: formattedPhone }
  })
  if (authError) throw new Error(authError.message)

  // Also write to user_profiles table
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ phone: formattedPhone, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (profileError) console.error('[updateUserPhone] profile update failed:', profileError)
  }
}

// ─── Resend Confirmation Email ────────────────────────────────────────────────

export async function resendConfirmationEmail(email: string, redirectNext?: string) {
  const supabase = createClient()
  const confirmUrl = redirectNext
    ? `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectNext)}`
    : `${window.location.origin}/auth/confirm`
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: confirmUrl,
    },
  })
  if (error) throw new Error(error.message)
}

// ─── Manual Sign Up ───────────────────────────────────────────────────────────

/**
 * Creates a new user with email + password.
 * Supabase sends a confirmation email automatically.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: { name: string; phone: string },
  redirectNext?: string
) {
  const supabase = createClient()
  const confirmUrl = redirectNext
    ? `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectNext)}`
    : `${window.location.origin}/auth/confirm`
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata.name,
        phone: metadata.phone ? `+91${metadata.phone}` : '',
      },
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })
  if (error) {
    if (
      error.message.includes('User already registered') ||
      error.message.includes('already been registered')
    ) {
      throw new Error('An account with this email already exists. Try signing in with Google.')
    }
    throw new Error(error.message)
  }
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('An account with this email already exists. Please sign in instead.')
  }
  return { needsConfirmation: true }
}

// ─── Manual Sign In ───────────────────────────────────────────────────────────

/**
 * Signs in with email + password.
 * On success, Supabase sets HttpOnly JWT + refresh token cookies automatically.
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Incorrect email or password.')
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please confirm your email before signing in. Check your inbox.')
    }
    throw new Error(error.message)
  }
  return data.session
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Sends a password reset email.
 */
export async function resetPassword(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw new Error(error.message)
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Signs out — clears Supabase session cookies AND localStorage onboarding flag.
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Sign out error:', error)
  if (typeof window !== 'undefined') {
    const keysToRemove = [
      'onboarding_complete',
      'userIntent',
      'curatedIds',
      'savedIds',
      'rejectedProjectIds',
      'compareItems',
      'propcinity_ai_rank_hash',
      'propcinity_reco_cache',
    ]
    keysToRemove.forEach(k => localStorage.removeItem(k))
  }
}

// ─── Session Helpers ──────────────────────────────────────────────────────────

/**
 * Get current session (client-side). Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

/**
 * Get current user (client-side). Validates JWT with Supabase server.
 */
export async function getUser() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}

/**
 * Listen to auth state changes (sign in, sign out, token refresh).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  const supabase = createClient()
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}
