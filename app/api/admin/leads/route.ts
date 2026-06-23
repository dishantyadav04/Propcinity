import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const patchSchema = z.object({
  status: z.enum(['new', 'contacted', 'site_visit_scheduled', 'site_visit_done', 'qualified', 'negotiating', 'closed_won', 'closed_lost', 'rejected'])
})

export async function GET(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const intentLabel = searchParams.get('intent') || ''

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const format = searchParams.get('format')

  let query = supabase
    .from('leads')
    .select('*, projects(name, location, city)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  if (status) query = query.eq('status', status)
  if (intentLabel) query = query.eq('intent_label', intentLabel)

  const { data, count, error } = await query
  if (error) {
    console.error('[admin/leads] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }

  if (format === 'csv') {
    const headers = [
      'booking_ref','name','phone','email','project','status',
      'intent_label','intent_score','timeline','budget_ready',
      'finance_type','purpose','trigger_source','created_at'
    ];
    const rows = (data ?? []).map((l: any) => [
      l.booking_ref ?? '',
      l.name ?? '',
      l.phone ?? '',
      l.email ?? '',
      l.projects?.name ?? '',
      l.status ?? '',
      l.intent_label ?? '',
      l.intent_score ?? '',
      l.timeline ?? '',
      l.budget_ready ?? '',
      l.finance_type ?? '',
      l.purpose ?? '',
      l.trigger_source ?? '',
      l.created_at ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="propcinity-leads-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ leads: data, total: count, page, limit })
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })
  const { data, error } = await supabase
    .from('leads')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[admin/leads] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
  return NextResponse.json({ lead: data })
}
