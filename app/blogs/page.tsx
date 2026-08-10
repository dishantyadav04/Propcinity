import { getPublishedBlogs } from '@/services/blogs'
import BlogListClient from '@/components/blogs/BlogListClient'

export default async function BlogsPage() {
  const { blogs, total } = await getPublishedBlogs(1, 12)
  return <BlogListClient initialBlogs={blogs} initialTotal={total} />
}
