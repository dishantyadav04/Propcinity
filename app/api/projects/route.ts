// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPublishedProjects } from '@/services/projects'
import { cached } from '@/lib/server-cache'
import { CACHE_PRESETS } from '@/lib/cache-control'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawExclude = searchParams.get('exclude')?.split(',').filter(Boolean) ?? []
  const excludeIds = rawExclude.filter(id => UUID_REGEX.test(id)).sort()

  const filters = {
    budgetMin: searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined,
    budgetMax: searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined,
    propertyTypes: searchParams.get('types')?.split(',').filter(Boolean).sort(),
    excludeIds,
  }

  // Cache key encodes every filter that changes the result set, so two
  // different filter combos never collide in Redis.
  const cacheKey = `projects:list:${JSON.stringify(filters)}`

  const projects = await cached(
    cacheKey,
    2 * 60 * 1000, // 2 min fresh
    () => getPublishedProjects(filters),
    { staleWhileRevalidateMs: 5 * 60 * 1000 } // serve stale up to 5 more minutes while refreshing
  )

  return NextResponse.json(projects, { headers: CACHE_PRESETS.LISTING })
}