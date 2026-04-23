import { NextRequest, NextResponse } from 'next/server'
import { getPublishedProjects } from '@/services/projects'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projects = await getPublishedProjects({
    budgetMin: searchParams.get('budgetMin') ? Number(searchParams.get('budgetMin')) : undefined,
    budgetMax: searchParams.get('budgetMax') ? Number(searchParams.get('budgetMax')) : undefined,
    propertyTypes: searchParams.get('types')?.split(',').filter(Boolean),
    excludeIds: searchParams.get('exclude')?.split(',').filter(Boolean),
  })
  return NextResponse.json(projects)
}
