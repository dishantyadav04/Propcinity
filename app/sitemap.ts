import { MetadataRoute } from 'next'
import { getPublishedProjects } from '@/services/projects'
import { getPublishedBlogs } from '@/services/blogs'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

// Next.js sitemap files are capped at 50,000 URLs each. Comfortably under
// that today; if projects+blogs ever approach it, switch to a sitemap index
// (generateSitemaps — see the setup notes for how).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let projectEntries: MetadataRoute.Sitemap = []
  try {
    const projects = await getPublishedProjects({})
    projectEntries = projects.map((p) => ({
      url: `${BASE_URL}/projects/${p.slug}`,
      // Falls back to "now" only if a project somehow has no updated_at —
      // real projects always carry it from the DB (NOT NULL DEFAULT now()).
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('[sitemap] Failed to load projects:', err)
  }

  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const { blogs } = await getPublishedBlogs(1, 1000)
    blogEntries = blogs.map((b) => ({
      url: `${BASE_URL}/blogs/${b.slug}`,
      lastModified: new Date(b.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (err) {
    console.error('[sitemap] Failed to load blogs:', err)
  }

  // Static, always-public marketing/informational pages.
  // Deliberately excluded: /dashboard, /profile*, /saved, /onboarding,
  // /ai-chat, /auth/*, /admin/* — all require auth or are private/no-index.
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  return [...staticEntries, ...projectEntries, ...blogEntries]
}