import { NextRequest, NextResponse } from 'next/server'
import { PostHog } from 'posthog-node'
import { z } from 'zod'
import { generateBookingRef } from '@/lib/booking-ref'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { sendBuyerConfirmation, sendOpsAlert } from '@/lib/resend'
import { getProjectsByIds } from '@/services/projects'
import { calculateIntentScore } from '@/services/leads'
import { leadsLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit'

// Singleton — reused across warm function invocations
let _phClient: PostHog | null = null
function getPhClient(): PostHog {
  if (!_phClient) {
    _phClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _phClient
}

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
  savedProjectIds:    z.array(z.string().uuid()).optional(),
  rejectedProjectIds: z.array(z.string().uuid()).optional(),
  curatedProjectIds:  z.array(z.string().uuid()).optional(),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const leadsResult = await checkRateLimit(leadsLimiter, ip)
  if (leadsResult.limited) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    console.warn('[leads/qualify] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const leadData = parsed.data
  const leadWithScore = calculateIntentScore(leadData)
  const projects = await getProjectsByIds([leadData.projectId])
  const projectName = projects[0]?.name || 'Selected Project'

  const supabase = createAdminSupabaseClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  const serverClient = await createServerSupabaseClient()
  let userId: string | null = null
  if (serverClient) {
    const { data: { user } } = await serverClient.auth.getUser()
    userId = user?.id ?? null
  }

  // NEW: Find-or-upgrade pattern — upgrade cold lead if exists, otherwise fresh insert
  let bookingRef = generateBookingRef()
  let leadId: string

  if (userId) {
    const { data: coldLead } = await supabase
      .from('leads')
      .select('id, booking_ref')
      .eq('user_id', userId)
      .is('project_id', null)
      .eq('journey_stage', 'onboarding')
      .maybeSingle()

    if (coldLead) {
      // UPGRADE path — update the cold lead in-place
      bookingRef = coldLead.booking_ref ?? generateBookingRef()
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          project_id: leadData.projectId,
          unit_config_id: leadData.unitConfigId ?? null,
          timeline: leadData.timeline,
          budget_ready: leadData.budgetReady,
          finance_type: leadData.financeType,
          decision_maker: leadData.decisionMaker,
          purpose: leadData.purpose,
          preferred_date: leadData.preferredDate ?? null,
          preferred_time: leadData.preferredTime ?? null,
          family_joining: leadData.familyJoining ?? null,
          weekend_preferred: leadData.weekendPreferred ?? null,
          virtual_tour_first: leadData.virtualTourFirst ?? null,
          intent_score: leadWithScore.intentScore,
          intent_label: leadWithScore.intentLabel,
          trigger_source: 'consultation_sheet|upgraded_from_onboarding',
          journey_stage: 'consultation_requested',
          status: 'new',
        })
        .eq('id', coldLead.id)

      if (updateError) {
        console.error('[leads/qualify] Upgrade error:', updateError)
        return NextResponse.json({ error: 'Failed to save consultation' }, { status: 500 })
      }

      leadId = coldLead.id
    } else {
      // FRESH INSERT path — signed-in user with no cold lead
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          project_id: leadData.projectId,
          unit_config_id: leadData.unitConfigId,
          user_id: userId,
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
          trigger_source: leadData.triggerSource || 'consultation_sheet',
          journey_stage: 'consultation_requested',
          status: 'new',
          booking_ref: bookingRef,
        })
        .select('id')
        .single()

      if (insertError || !newLead) {
        if ((insertError as any)?.code === '23505') {
          return NextResponse.json(
            { error: "You've already submitted a consultation request for this project." },
            { status: 409 }
          )
        }
        console.error('[leads/qualify] Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to save consultation' }, { status: 500 })
      }

      leadId = newLead.id
    }
  } else {
    // GUEST path — no user session, always fresh insert
    const { data: guestLead, error: guestError } = await supabase
      .from('leads')
      .insert({
        project_id: leadData.projectId,
        unit_config_id: leadData.unitConfigId,
        user_id: null,
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
        trigger_source: [
          leadData.triggerSource || 'unknown',
          `saved:${(leadData.savedProjectIds ?? []).length}`,
          `rejected:${(leadData.rejectedProjectIds ?? []).length}`,
          `curated:${(leadData.curatedProjectIds ?? []).length}`,
        ].join('|'),
        journey_stage: 'consultation_requested',
        status: 'new',
        booking_ref: bookingRef,
      })
      .select('id')
      .single()

    if (guestError || !guestLead) {
      if ((guestError as any)?.code === '23505') {
        return NextResponse.json(
          { error: "You've already submitted a consultation request for this project." },
          { status: 409 }
        )
      }
      console.error('[leads/qualify] Guest insert error:', guestError)
      return NextResponse.json({ error: 'Failed to save consultation' }, { status: 500 })
    }

    leadId = guestLead.id
  }

  // Fire PostHog server-side conversion event (non-blocking)
  // intentLabel intentionally NOT included — stays internal
  try {
    getPhClient().capture({
      distinctId: leadId,
      event: 'consultation_completed',
      properties: {
        projectId: leadData.projectId,
        projectName,
        timeline: leadData.timeline,
        triggerSource: leadData.triggerSource || 'unknown',
        savedCount:    leadData.savedProjectIds?.length ?? 0,
        rejectedCount: leadData.rejectedProjectIds?.length ?? 0,
        curatedCount:  leadData.curatedProjectIds?.length ?? 0,
      },
    })
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
