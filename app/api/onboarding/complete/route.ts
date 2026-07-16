// app/api/onboarding/complete/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ONBOARDING_COOKIE_NAME, ONBOARDING_COOKIE_MAX_AGE } from '@/lib/onboarding-cookie'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Defense-in-depth: verify onboarding_complete is actually true in the DB
  // before caching it as true — don't just trust the caller.
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_complete) {
    return NextResponse.json({ error: 'Onboarding not complete' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(ONBOARDING_COOKIE_NAME, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONBOARDING_COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}
