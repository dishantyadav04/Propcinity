import { MetadataRoute } from 'next'
import { getPublishedProjects } from '@/services/projects'
import { getPublishedBlogs } from '@/services/blogs'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projectEntries: MetadataRoute.Sitemap = []
  try {
    const projects = await getPublishedProjects({})
    projectEntries = projects.map((p) => ({
      url: `${BASE_URL}/projects/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch { /* silent fallback */ }

  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const { blogs } = await getPublishedBlogs(1, 1000)
    blogEntries = blogs.map((b) => ({
      url: `${BASE_URL}/blogs/${b.slug}`,
      lastModified: new Date(b.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch { /* silent fallback */ }

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...projectEntries,
    ...blogEntries,
  ]
}
