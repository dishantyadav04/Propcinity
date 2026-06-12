import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

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

  if (error) {
    console.error('[admin/builders/project-update] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }

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
