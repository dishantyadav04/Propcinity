import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/services/projects'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}
