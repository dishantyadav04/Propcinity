// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPublishedProjects } from '@/services/projects'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawExclude = searchParams.get('exclude')?.split(',').filter(Boolean) ?? []
  const excludeIds = rawExclude.filter(id => UUID_REGEX.test(id))

  const projects = await getPublishedProjects({
    budgetMin: searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined,
    budgetMax: searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined,
    propertyTypes: searchParams.get('types')?.split(',').filter(Boolean),
    excludeIds,
  })

  return NextResponse.json(projects)
}
