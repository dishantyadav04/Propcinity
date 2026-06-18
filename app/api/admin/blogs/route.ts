import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { blogSchema } from '@/lib/blog-schema'
import { adminGetAllBlogs, adminCreateBlog, adminGetBlogBySlug } from '@/services/blogs'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

export async function GET(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const { searchParams } = new URL(request.url)

  // Slug uniqueness check
  const slugCheck = searchParams.get('slug')
  if (slugCheck) {
    const existing = await adminGetBlogBySlug(slugCheck)
    return NextResponse.json({ available: !existing })
  }

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

  const result = await adminGetAllBlogs(page, limit)
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated(request)) return unauth()

  const body = await request.json().catch(() => null)
  const parsed = blogSchema.safeParse(body)
  if (!parsed.success) {
    console.warn('[admin/blogs] Validation failed:', JSON.stringify(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid blog payload' }, { status: 400 })
  }

  try {
    const id = await adminCreateBlog(parsed.data)
    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error('[admin/blogs] Create error:', err)
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
}
