// app/api/admin/builders/[id]/project-update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

const schema = z.object({
  project_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  image_url: z.string().url().optional(),
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
    .insert({
      builder_id: id,
      project_id: parsed.data.project_id,
      title: parsed.data.title,
      body: parsed.data.body,
      image_url: parsed.data.image_url ?? null,
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
