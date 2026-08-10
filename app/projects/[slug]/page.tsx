import { notFound } from 'next/navigation'
import { getProjectBySlug, getPublishedProjects } from '@/services/projects'
import ProjectDetailClient from '@/components/property/ProjectDetailClient'

export async function generateStaticParams() {
  const projects = await getPublishedProjects({})
  return projects.map((p) => ({ slug: p.slug }))
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()
  return <ProjectDetailClient project={project} />
}
