import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { adminUpdateProject, adminDeleteProject } from '@/services/projects'
import { projectSchema } from '@/lib/project-schema'

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
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = projectSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 })
  }

  try {
    await adminUpdateProject(id, parsed.data)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
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
