import { NextRequest, NextResponse } from 'next/server'
import { getBlogBySlug, getRelatedBlogs } from '@/services/blogs'
import { cached } from '@/lib/server-cache'
import { CACHE_PRESETS, noStore } from '@/lib/cache-control'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const result = await cached(
    `blogs:detail:${slug}`,
    5 * 60 * 1000,
    async () => {
      const blog = await getBlogBySlug(slug)
      if (!blog) return null
      const related = await getRelatedBlogs(blog.id, blog.category, 3)
      return { blog, related }
    },
    { staleWhileRevalidateMs: 10 * 60 * 1000 }
  )

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStore() })
  }

  return NextResponse.json(result, { headers: CACHE_PRESETS.DETAIL })
}