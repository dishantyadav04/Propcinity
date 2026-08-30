import { getPublishedBlogsCached } from '@/services/blogs'
import BlogListClient from '@/components/blogs/BlogListClient'

export default async function BlogsPage() {
  const { blogs, total } = await getPublishedBlogsCached(1, 12)
  return <BlogListClient initialBlogs={blogs} initialTotal={total} />
}
