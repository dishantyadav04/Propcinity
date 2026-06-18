import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { blogSchema } from '@/lib/blog-schema'
import {
  adminGetBlogById,
  adminUpdateBlog,
  adminDeleteBlog,
  adminToggleBlogStatus,
} from '@/services/blogs'
import { Blog } from '@/types/blog'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const statusSchema = z.object({
  status: z.enum(['draft', 'published', 'scheduled']),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const blog = await adminGetBlogById(id)
  if (!blog) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ blog })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = blogSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[admin/blogs] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid blog payload' }, { status: 400 })
  }

  try {
    await adminUpdateBlog(id, parsed.data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/blogs] Update error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
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

  await adminDeleteBlog(id)
  return NextResponse.json({ success: true })
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
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status payload' }, { status: 400 })
  }

  try {
    await adminToggleBlogStatus(id, parsed.data.status as Blog['status'])
    return NextResponse.json({ success: true, status: parsed.data.status })
  } catch (err) {
    console.error('[admin/blogs] Toggle status error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
}
