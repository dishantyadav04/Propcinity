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

// ─── OAuth 2.0 (Apple) ───────────────────────────────────────────────────────

/**
 * Initiates Apple OAuth 2.0 PKCE flow.
 * Browser is redirected to Apple → returns to /auth/callback.
 * NOTE: Apple requires HTTPS in production. Will not work on http://localhost.
 * @param redirectAfter  Path to land on after successful auth (default: /dashboard)
 */
export async function signInWithApple(redirectAfter = '/dashboard') {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfter)}`,
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
  metadata: { name: string; phone: string }
) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: metadata.name,
        phone: metadata.phone,
      },
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })
  if (error) throw new Error(error.message)
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
    localStorage.removeItem('onboarding_complete')
    localStorage.removeItem('userIntent')
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
