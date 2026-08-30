import { notFound } from 'next/navigation'
import { getProjectBySlugCached, getPublishedProjectSlugs } from '@/services/projects'
import ProjectDetailClient from '@/components/property/ProjectDetailClient'

export async function generateStaticParams() {
  const slugs = await getPublishedProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlugCached(slug)
  if (!project) notFound()
  return <ProjectDetailClient project={project} />
}
