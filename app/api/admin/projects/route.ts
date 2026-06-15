import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { projectSchema } from '@/lib/project-schema'
import {
  adminCreateProject,
  adminDeleteProject,
  adminGetAllProjects,
  adminTogglePublished,
  adminUpdateProject,
} from '@/services/projects'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const idSchema = z.object({
  id: z.string().uuid(),
})

const publishSchema = z.object({
  isPublished: z.boolean(),
})

export async function GET(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))

  const result = await adminGetAllProjects(page, limit)
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[admin/projects] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 })
  }

  try {
    const id = await adminCreateProject(parsed.data)
    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error('[admin/projects] Create error:', err)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const idParsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[admin/projects] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 })
  }

  await adminUpdateProject(idParsed.data.id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const parsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await adminDeleteProject(parsed.data.id)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const idParsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid publish payload' }, { status: 400 })
  }

  await adminTogglePublished(idParsed.data.id, parsed.data.isPublished)
  return NextResponse.json({ success: true, isPublished: parsed.data.isPublished })
}
