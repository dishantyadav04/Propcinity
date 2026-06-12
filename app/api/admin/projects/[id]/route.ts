import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { projectSchema } from '@/lib/project-schema'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { adminUpdateProject, adminDeleteProject } from '@/services/projects'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('projects')
    .select('*, unit_configs(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ project: data })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[admin/projects] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 })
  }

  await adminUpdateProject(id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  await adminDeleteProject(id)
  return NextResponse.json({ success: true })
}
