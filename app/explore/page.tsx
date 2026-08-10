import { getPublishedProjects } from '@/services/projects'
import ExploreClient from '@/components/property/ExploreClient'

export default async function ExplorePage() {
  const initialProjects = await getPublishedProjects({})
  return <ExploreClient initialProjects={initialProjects} />
}
