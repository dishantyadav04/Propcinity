import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'

function generateBookingRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomPart = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  return `REF-${randomPart}`
}

const TIMELINE_MAP: Record<string, string> = {
  under_1_year: 'within_3_months',
  '1_to_2_years': '3_6_months',
  '3_to_5_years': '6_12_months',
  '5_plus': 'exploring',
}

const PURPOSE_MAP: Record<string, string> = {
  'self-use': 'self_use',
  investment: 'investment',
  both: 'both',
}

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email().optional(),
  timeline: z.string().optional(),
  purpose: z.string().optional(),
  city: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // 1. Auth check — only for signed-in users
  const serverClient = await createServerSupabaseClient()
  if (!serverClient) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate body
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { name, phone, email, timeline, purpose, city } = parsed.data

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  // 3. Check if cold lead already exists for this user
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('user_id', user.id)
    .is('project_id', null)
    .eq('journey_stage', 'onboarding')
    .maybeSingle()

  const mappedTimeline = (timeline && TIMELINE_MAP[timeline]) ? TIMELINE_MAP[timeline] : 'exploring'
  const mappedPurpose = (purpose && PURPOSE_MAP[purpose]) ? PURPOSE_MAP[purpose] : 'self_use'

  if (existing) {
    // 4a. Update existing cold lead
    await supabase.from('leads').update({
      name,
      phone,
      email,
      timeline: mappedTimeline,
      purpose: mappedPurpose,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)

    return NextResponse.json({ success: true, leadId: existing.id })
  }

  // 4b. Insert new cold lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      project_id: null,         // No project at onboarding stage
      user_id: user.id,
      name,
      phone,
      email,
      timeline: mappedTimeline,
      budget_ready: 'no_still_planning',
      finance_type: 'unsure',
      decision_maker: 'myself',
      purpose: mappedPurpose,
      intent_label: 'cold',    // Always forced cold — no scoring at onboarding
      intent_score: 0,
      trigger_source: 'onboarding',
      journey_stage: 'onboarding',
      status: 'new',
      booking_ref: generateBookingRef(),
    })
    .select('id')
    .single()

  if (error) {
    // Ignore 23505 (duplicate) — race condition safe
    if ((error as any)?.code === '23505') {
      return NextResponse.json({ success: true })
    }
    console.error('[leads/cold] Insert error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  // NO emails. NO PostHog. This is passive capture only.
  return NextResponse.json({ success: true, leadId: lead.id })
}
