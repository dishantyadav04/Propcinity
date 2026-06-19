import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  // Query actual registered users
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profileError) {
    console.error('[admin/users] profiles error:', profileError)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }

  // Merge in intent data (onboarding answers) by user_id
  const { data: intents } = await supabase
    .from('user_intents')
    .select('*')

  const intentsMap = new Map((intents || []).map((i: any) => [i.user_id, i]))

  const merged = (profiles || []).map((p: any) => ({
    ...p,
    intent: intentsMap.get(p.id) || null,
    location: intentsMap.get(p.id)?.city || null,
    purpose: intentsMap.get(p.id)?.purpose || null,
    timeline: intentsMap.get(p.id)?.timeline || null,
    budget: intentsMap.get(p.id)
      ? { min: intentsMap.get(p.id).budget_min, max: intentsMap.get(p.id).budget_max }
      : null,
    property_types: intentsMap.get(p.id)?.bhk_types || [],
  }))

  return NextResponse.json({ users: merged })
}