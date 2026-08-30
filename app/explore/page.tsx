import { getPublishedProjectsCached } from '@/services/projects'
import ExploreClient from '@/components/property/ExploreClient'

export default async function ExplorePage() {
  const initialProjects = await getPublishedProjectsCached({})
  return <ExploreClient initialProjects={initialProjects} />
}
