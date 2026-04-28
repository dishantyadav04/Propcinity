import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { calculateBuilderScore } from '@/lib/scoring-engine'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { data, error } = await supabase
    .from('builders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ builders: data })
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  // Auto-calculate score on creation
  const scoreResult = calculateBuilderScore({
    reraRegistered: body.rera_registered ?? false,
    yearsInBusiness: body.years_in_business ?? 0,
    totalProjectsDelivered: body.total_projects_delivered ?? 0,
    onTimeDeliveryPercent: body.on_time_delivery_percent ?? 100,
    avgDelayMonths: body.avg_delay_months ?? 0,
    legalCases: body.legal_cases ?? 0,
    customerComplaints: body.customer_complaints ?? 0,
    refundDisputes: body.refund_disputes ?? 0,
  })

  const { data, error } = await supabase
    .from('builders')
    .insert({
      ...body,
      builder_score: scoreResult.total,
      score_breakdown: scoreResult.breakdown,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ builder: data })
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  // Fetch existing project updates to recalculate score
  const { data: updates } = await supabase
    .from('builder_project_updates')
    .select('delay_months, is_delivered, complaints_count')
    .eq('builder_id', id)

  const projectUpdates = (updates || []).map(u => ({
    delayMonths: u.delay_months || 0,
    isDelivered: u.is_delivered || false,
    complaintsCount: u.complaints_count || 0,
  }))

  // Import inline to avoid circular deps
  const { recalculateBuilderFromProjects, calculateBuilderScore } = await import('@/lib/scoring-engine')

  const base = {
    reraRegistered: body.rera_registered ?? false,
    yearsInBusiness: body.years_in_business ?? 0,
    totalProjectsDelivered: body.total_projects_delivered ?? 0,
    onTimeDeliveryPercent: body.on_time_delivery_percent ?? 100,
    avgDelayMonths: body.avg_delay_months ?? 0,
    legalCases: body.legal_cases ?? 0,
    customerComplaints: body.customer_complaints ?? 0,
    refundDisputes: body.refund_disputes ?? 0,
  }

  const merged = projectUpdates.length > 0
    ? recalculateBuilderFromProjects(base, projectUpdates)
    : base

  const scoreResult = calculateBuilderScore(merged)

  const { data, error } = await supabase
    .from('builders')
    .update({
      ...body,
      builder_score: scoreResult.total,
      score_breakdown: scoreResult.breakdown,
      avg_delay_months: merged.avgDelayMonths,
      on_time_delivery_percent: merged.onTimeDeliveryPercent,
      customer_complaints: merged.customerComplaints,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cascade: update trust scores of all linked projects
  const { data: linkedProjects } = await supabase
    .from('projects')
    .select('id, trust_score, construction_percent, construction_status, rera_id, rera_expiry')
    .eq('builder_id', id)

  if (linkedProjects?.length) {
    const { calculateProjectTrust } = await import('@/lib/scoring-engine')
    for (const project of linkedProjects) {
      const trust = calculateProjectTrust({
        builderScore: scoreResult.total,
        reraId: project.rera_id,
        reraExpiry: project.rera_expiry,
        constructionPercent: project.construction_percent || 0,
        constructionStatus: project.construction_status || 'under_construction',
        priceVsAreaAvg: 'at',
        amenitiesCount: 5,
        legalClearances: !!project.rera_id,
        bankApproved: false,
      })
      await supabase
        .from('projects')
        .update({ trust_score: trust.trustScore, risk_label: trust.riskLabel })
        .eq('id', project.id)
    }
  }

  return NextResponse.json({ builder: data, scoreResult })
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) return unauth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { error } = await supabase.from('builders').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
