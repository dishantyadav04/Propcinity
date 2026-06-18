import { NextRequest, NextResponse } from 'next/server'
import { getPublishedBlogs } from '@/services/blogs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10) || 12))
  const category = searchParams.get('category') ?? undefined
  const tag = searchParams.get('tag') ?? undefined

  const result = await getPublishedBlogs(page, limit, { category, tag })
  return NextResponse.json(result)
}
