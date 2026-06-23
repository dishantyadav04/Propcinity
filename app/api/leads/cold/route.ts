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
  name:         z.string().trim().min(1).max(100).default(''),
  phone:        z.string().min(1).max(20),
  email:        z.string().email().optional(),
  timeline:     z.string().optional(),
  purpose:      z.string().optional(),
  city:         z.string().optional(),
  budgetMin:    z.number().min(0).optional(),
  budgetMax:    z.number().min(0).optional(),
  isOpenBudget: z.boolean().optional(),
  bhkTypes:     z.array(z.string()).max(10).optional(),
  subLocations: z.array(z.string()).max(20).optional(),
  propertyType: z.array(z.string()).max(5).optional(),
  preferences:  z.array(z.string()).max(20).optional(),
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

  const {
    name, email, timeline, purpose, city,
    budgetMin, budgetMax, isOpenBudget,
    bhkTypes, subLocations, propertyType, preferences,
  } = parsed.data

  // Strip +91 / 0 prefix and any spaces or dashes — normalise to 10 bare digits
  const phone = parsed.data.phone
    .replace(/^\+91[\s-]?/, '')
    .replace(/^0/, '')
    .replace(/[\s-]/g, '')

  // Validate the cleaned phone
  if (!/^[6-9]\d{9}$/.test(phone)) {
    console.warn('[leads/cold] Invalid phone after normalise:', parsed.data.phone)
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // Skip saving if name is empty — not enough data yet
  // This happens when Google user has no display_name set
  const safeName = name.trim().length >= 2 ? name.trim() : (email?.split('@')[0] ?? 'User')

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
      name:          safeName,
      phone,
      email,
      timeline:      mappedTimeline,
      purpose:       mappedPurpose,
      budget_min:    budgetMin    ?? null,
      budget_max:    budgetMax    ?? null,
      is_open_budget: isOpenBudget ?? false,
      bhk_types:     bhkTypes     ?? [],
      sub_locations: subLocations  ?? [],
      property_type: propertyType  ?? [],
      preferences:   preferences   ?? [],
      updated_at:    new Date().toISOString(),
    }).eq('id', existing.id)

    return NextResponse.json({ success: true, leadId: existing.id })
  }

  // 4b. Insert new cold lead
  console.log('[leads/cold] Attempting insert for user:', user.id, '| phone:', phone)
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      project_id: null,         // No project at onboarding stage
      user_id: user.id,
      name: safeName,
      phone,
      email,
      timeline: mappedTimeline,
      budget_min:     budgetMin    ?? null,
      budget_max:     budgetMax    ?? null,
      is_open_budget: isOpenBudget ?? false,
      bhk_types:      bhkTypes     ?? [],
      sub_locations:  subLocations  ?? [],
      property_type:  propertyType  ?? [],
      preferences:    preferences   ?? [],
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
    if ((error as any)?.code === '23505') {
      // A 23505 here means the bad old index is still active (no WHERE project_id IS NOT NULL).
      // Log it clearly so it's visible in server logs.
      console.error('[leads/cold] BLOCKED by unique index — run the SQL migration to fix:', (error as any)?.message)
      // Try to fetch the existing row and return its id anyway
      const { data: fallback } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      return NextResponse.json({ success: true, leadId: fallback?.id ?? null, blocked: true })
    }
    console.error('[leads/cold] Insert error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }

  // NO emails. NO PostHog. This is passive capture only.
  return NextResponse.json({ success: true, leadId: lead.id })
}
