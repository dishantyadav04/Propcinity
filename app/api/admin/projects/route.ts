import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { projectSchema, flattenZodError } from '@/lib/project-schema'
import { invalidateCache } from '@/lib/server-cache'
import { projectCacheKeys } from '@/lib/cache-keys'
import { noStore } from '@/lib/cache-control'
import {
  adminCreateProject,
  adminDeleteProject,
  adminGetAllProjects,
  adminTogglePublished,
  adminUpdateProject,
  getProjectSlugById,
} from '@/services/projects'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

/** Bust every cache layer touched by a project create/update/delete/publish. */
async function invalidateProject(slug?: string) {
  await Promise.all(projectCacheKeys(slug).map(invalidateCache))
  // Static /projects/[slug] page + the /explore listing page.
  if (slug) revalidatePath(`/projects/${slug}`)
  revalidatePath('/explore')
  revalidatePath('/sitemap.xml')
}

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
  const location = searchParams.get('location') ?? undefined

  const result = await adminGetAllProjects(page, limit, location)
  return NextResponse.json(result, { headers: noStore() })
}

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    const { fieldErrors, formErrors } = flattenZodError(parsed.error)
    console.warn('[admin/projects] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json(
      {
        error: 'Invalid project payload',
        fieldErrors,
        formErrors,
      },
      { status: 400 }
    )
  }

  try {
    const id = await adminCreateProject(parsed.data)
    await invalidateProject(parsed.data.slug)
    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error('[admin/projects] Create error:', err)
    Sentry.captureException(err)
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
    const { fieldErrors, formErrors } = flattenZodError(parsed.error)
    console.warn('[admin/projects] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json(
      {
        error: 'Invalid project payload',
        fieldErrors,
        formErrors,
      },
      { status: 400 }
    )
  }

  try {
    await adminUpdateProject(idParsed.data.id, parsed.data)
    // The old slug (if it changed) is only known by the DB. Bust both to be
    // safe — cheap since these are just Redis DELs, not re-fetches.
    await invalidateProject(parsed.data.slug)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[PUT /api/admin/projects]', err.message)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const parsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const slug = await getProjectSlugById(parsed.data.id)
  await adminDeleteProject(parsed.data.id)
  await invalidateProject(slug ?? undefined)
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
    const { fieldErrors, formErrors } = flattenZodError(parsed.error)
    return NextResponse.json(
      {
        error: 'Invalid publish payload',
        fieldErrors,
        formErrors,
      },
      { status: 400 }
    )
  }

  const slug = await getProjectSlugById(idParsed.data.id)
  await adminTogglePublished(idParsed.data.id, parsed.data.isPublished)
  await invalidateProject(slug ?? undefined)
  return NextResponse.json({ success: true, isPublished: parsed.data.isPublished })
}
