// Reproduces a real staleness bug: the admin routes that the actual admin
// UI calls for editing/publishing/deleting a blog (BlogForm.tsx, and
// app/admin/blogs/page.tsx both hit /api/admin/blogs/[id]) never call
// invalidateCache(). The sibling /api/admin/projects (query-param) route
// does this correctly (see the passing case below) — [id]-style blog
// mutations should follow the same contract.
//
// These tests import the route handlers directly and assert on the mocked
// lib/server-cache + next/cache calls, rather than hitting Redis, so they
// run fully offline and fail loudly the moment someone edits a mutation
// route without wiring up invalidation.

import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticated: vi.fn(async () => true),
}))

vi.mock('@/lib/server-cache', () => ({
  invalidateCache: vi.fn(async () => {}),
  cached: vi.fn(async (_key: string, _ttl: number, fetcher: () => unknown) => fetcher()),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/services/blogs', () => ({
  adminGetBlogById: vi.fn(async () => ({ id: 'blog-1', slug: 'my-post' })),
  adminUpdateBlog: vi.fn(async () => {}),
  adminDeleteBlog: vi.fn(async () => {}),
  adminToggleBlogStatus: vi.fn(async () => {}),
}))

vi.mock('@/services/projects', () => ({
  adminUpdateProject: vi.fn(async () => {}),
  adminDeleteProject: vi.fn(async () => {}),
  getProjectSlugById: vi.fn(async () => 'my-project'),
}))

vi.mock('@/lib/blog-schema', () => ({
  blogSchema: { safeParse: (body: unknown) => ({ success: true, data: body }) },
}))

vi.mock('@/lib/project-schema', () => ({
  projectSchema: {
    safeParse: (body: unknown) => ({ success: true, data: body }),
    partial: () => ({ safeParse: (body: unknown) => ({ success: true, data: body }) }),
  },
  flattenZodError: () => ({ fieldErrors: {}, formErrors: [] }),
}))

const UUID = '11111111-1111-1111-1111-111111111111'

describe('admin blog mutations invalidate cache (the route BlogForm.tsx & admin/blogs/page.tsx actually call)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('PUT /api/admin/blogs/[id] busts the blog cache keys', async () => {
    const { PUT } = await import('@/app/api/admin/blogs/[id]/route')
    const { invalidateCache } = await import('@/lib/server-cache')

    const req = new NextRequest(`http://localhost/api/admin/blogs/${UUID}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated title', slug: 'my-post' }),
    })
    await PUT(req, { params: Promise.resolve({ id: UUID }) })

    // Currently fails: app/api/admin/blogs/[id]/route.ts never imports or
    // calls invalidateCache, so an admin editing a live blog post via the
    // real editor leaves blogs:list:* / blogs:detail:<slug> serving stale
    // data for up to the 5–10 min SWR window.
    expect(invalidateCache).toHaveBeenCalled()
  })

  it('DELETE /api/admin/blogs/[id] busts the blog cache keys', async () => {
    const { DELETE } = await import('@/app/api/admin/blogs/[id]/route')
    const { invalidateCache } = await import('@/lib/server-cache')

    const req = new NextRequest(`http://localhost/api/admin/blogs/${UUID}`, { method: 'DELETE' })
    await DELETE(req, { params: Promise.resolve({ id: UUID }) })

    expect(invalidateCache).toHaveBeenCalled()
  })

  it('PATCH /api/admin/blogs/[id] (publish/unpublish toggle) busts the blog cache keys', async () => {
    const { PATCH } = await import('@/app/api/admin/blogs/[id]/route')
    const { invalidateCache } = await import('@/lib/server-cache')

    const req = new NextRequest(`http://localhost/api/admin/blogs/${UUID}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    })
    await PATCH(req, { params: Promise.resolve({ id: UUID }) })

    // Publishing a blog is exactly the case where stale cache is worst: the
    // post can 404 from blogs:detail cache for minutes after "Publish" is
    // clicked, or a freshly-unpublished post stays visible.
    expect(invalidateCache).toHaveBeenCalled()
  })
})

describe('admin project mutations invalidate cache consistently across both route shapes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sanity check: PUT /api/admin/projects?id= (the route ProjectForm.tsx calls) already invalidates', async () => {
    const { PUT } = await import('@/app/api/admin/projects/route')
    const { invalidateCache } = await import('@/lib/server-cache')

    const req = new NextRequest(`http://localhost/api/admin/projects?id=${UUID}`, {
      method: 'PUT',
      body: JSON.stringify({ slug: 'my-project' }),
    })
    await PUT(req)

    expect(invalidateCache).toHaveBeenCalled()
  })
})
