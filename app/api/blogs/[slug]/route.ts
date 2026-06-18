import { NextRequest, NextResponse } from 'next/server'
import { getBlogBySlug, getRelatedBlogs } from '@/services/blogs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const blog = await getBlogBySlug(slug)
  if (!blog) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const related = await getRelatedBlogs(blog.id, blog.category, 3)

  return NextResponse.json({ blog, related })
}
