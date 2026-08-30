import { Metadata } from 'next'
import { getProjectBySlugCached } from '@/services/projects'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlugCached(slug)

  if (!project) return {}

  const ogImage = (project as any).ogImage || project.images?.[0] || null
  const canonical = `https://propcinity.in/projects/${project.slug}`

  const description = project.description?.slice(0, 160)
    || `${project.name} in ${project.location}, ${project.city}. ${project.unitConfigs?.length ? project.unitConfigs.map(u => u.type || 'Unit').join(', ') + ' available.' : ''} Explore pricing, floor plans, RERA status and more.`

  const title = `${project.name} by ${project.builderName} — Propcinity`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: project.name,
      description,
      type: 'website',
      url: canonical,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: project.name }]
        : undefined,
      siteName: 'Propcinity',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.name,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default function ProjectSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
