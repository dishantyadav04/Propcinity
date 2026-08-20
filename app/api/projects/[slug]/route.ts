import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/services/projects'
import { cached } from '@/lib/server-cache'
import { CACHE_PRESETS, noStore } from '@/lib/cache-control'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const project = await cached(
    `projects:detail:${slug}`,
    5 * 60 * 1000,
    () => getProjectBySlug(slug),
    { staleWhileRevalidateMs: 10 * 60 * 1000 }
  )
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStore() })
  return NextResponse.json(project, { headers: CACHE_PRESETS.DETAIL })
}