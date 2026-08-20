import { NextRequest, NextResponse } from 'next/server'
import { getPublishedBlogs } from '@/services/blogs'
import { cached } from '@/lib/server-cache'
import { CACHE_PRESETS } from '@/lib/cache-control'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10) || 12))
  const category = searchParams.get('category') ?? undefined
  const tag = searchParams.get('tag') ?? undefined

  const cacheKey = `blogs:list:${page}:${limit}:${category ?? ''}:${tag ?? ''}`
  const result = await cached(
    cacheKey,
    2 * 60 * 1000,
    () => getPublishedBlogs(page, limit, { category, tag }),
    { staleWhileRevalidateMs: 5 * 60 * 1000 }
  )
  return NextResponse.json(result, { headers: CACHE_PRESETS.LISTING })
}