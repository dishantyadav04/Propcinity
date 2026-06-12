// app/api/admin/builders/[id]/project-update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const schema = z.object({
  project_id: z.string().uuid(),
  project_name: z.string().trim().min(1).max(200),
  promised_possession: z.string().trim().max(20).optional(),
  actual_possession: z.string().trim().max(20).optional(),
  delay_months: z.number().int().min(0).max(600).optional().default(0),
  is_delivered: z.boolean().optional().default(false),
  quality_rating: z.number().min(0).max(5).optional(),
  complaints_count: z.number().int().min(0).optional().default(0),
  notes: z.string().trim().max(2000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid builder id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    console.warn('[admin/builders/project-update] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { data, error } = await supabase
    .from('builder_project_updates')
    .upsert({
      builder_id: id,
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/builders/project-update] DB error:', error)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }

  // NOTE: Removed the internal fetch() anti-pattern that was here previously.
  // If cache invalidation is needed, call the service function directly.

  return NextResponse.json({ update: data })
}
