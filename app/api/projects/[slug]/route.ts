import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/services/projects'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const project = await getProjectBySlug(params.slug)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}
