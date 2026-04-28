import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  // Insert project update record
  const { data, error } = await supabase
    .from('builder_project_updates')
    .upsert({
      builder_id: id,
      project_id: body.project_id,
      project_name: body.project_name,
      promised_possession: body.promised_possession,
      actual_possession: body.actual_possession,
      delay_months: body.delay_months || 0,
      is_delivered: body.is_delivered || false,
      quality_rating: body.quality_rating,
      complaints_count: body.complaints_count || 0,
      notes: body.notes,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger builder score recalculation via PUT
  await fetch(`${req.nextUrl.origin}/api/admin/builders?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: JSON.stringify({}),
  })

  return NextResponse.json({ update: data })
}
