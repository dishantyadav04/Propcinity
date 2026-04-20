import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { sendBuyerConfirmation, sendOpsAlert } from '@/lib/resend'
import { getProjectsByIds } from '@/services/projects'
import { calculateIntentScore } from '@/services/leads'

const schema = z.object({
  projectId: z.string().uuid(),
  unitConfigId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email().optional(),
  timeline: z.enum(['within_3_months', '3_6_months', '6_12_months', 'exploring']),
  budgetReady: z.enum(['yes_full', 'yes_partial', 'no_still_planning', 'loan_approved']),
  financeType: z.enum(['self_funded', 'loan_approved', 'loan_not_applied', 'unsure']),
  decisionMaker: z.enum(['myself', 'family_involved', 'spouse_only', 'parents_involved']),
  purpose: z.enum(['self_use', 'investment', 'both']),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  familyJoining: z.boolean().optional(),
  weekendPreferred: z.boolean().optional(),
  virtualTourFirst: z.boolean().optional(),
  triggerSource: z.string().trim().max(100).optional(),
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS_PER_HOUR = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) return true
  entry.count += 1
  return false
}

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for') || 'unknown'
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid form data', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const leadData = parsed.data
  const leadWithScore = calculateIntentScore(leadData)
  const projects = await getProjectsByIds([leadData.projectId])
  const projectName = projects[0]?.name || 'Selected Project'

  const supabase = createAdminSupabaseClient()
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      project_id: leadData.projectId,
      unit_config_id: leadData.unitConfigId,
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email,
      timeline: leadData.timeline,
      budget_ready: leadData.budgetReady,
      finance_type: leadData.financeType,
      decision_maker: leadData.decisionMaker,
      purpose: leadData.purpose,
      preferred_date: leadData.preferredDate,
      preferred_time: leadData.preferredTime,
      family_joining: leadData.familyJoining,
      weekend_preferred: leadData.weekendPreferred,
      virtual_tour_first: leadData.virtualTourFirst,
      intent_score: leadWithScore.intentScore,
      intent_label: leadWithScore.intentLabel,
      trigger_source: leadData.triggerSource || 'unknown',
    })
    .select('booking_ref')
    .single()

  if (error || !lead) {
    console.error('Lead insert error:', error)
    return NextResponse.json({ error: 'Failed to save consultation' }, { status: 500 })
  }

  const bookingRef = lead.booking_ref

  // Fire PostHog server-side conversion event (non-blocking)
  // intentLabel intentionally NOT included — stays internal
  try {
    const { PostHog } = await import('posthog-node')
    const phClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    })
    phClient.capture({
      distinctId: leadData.phone, // use phone as anonymous ID server-side
      event: 'consultation_completed',
      properties: {
        projectId: leadData.projectId,
        projectName,
        timeline: leadData.timeline,
        triggerSource: leadData.triggerSource || 'unknown',
        // intentLabel and intentScore deliberately excluded
      },
    })
    await phClient.shutdown()
  } catch {
    // PostHog failure must never break lead saving
  }

  Promise.all([
    sendBuyerConfirmation({
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      projectName,
      preferredDate: leadData.preferredDate || 'To be confirmed',
      preferredTime: leadData.preferredTime || 'To be confirmed',
      bookingRef,
    }),
    sendOpsAlert({
      name: leadData.name,
      phone: leadData.phone,
      projectName,
      intentLabel: leadWithScore.intentLabel,
      intentScore: leadWithScore.intentScore,
      timeline: leadData.timeline,
      budgetReady: leadData.budgetReady,
      financeType: leadData.financeType,
      decisionMaker: leadData.decisionMaker,
      preferredDate: leadData.preferredDate,
      preferredTime: leadData.preferredTime,
      familyJoining: leadData.familyJoining,
      bookingRef,
    }),
  ]).catch((error) => console.error('Email error:', error))

  return NextResponse.json({ success: true, bookingRef })
}
