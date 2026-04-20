export interface UserIntent {
  budget: { min: number; max: number }
  location: string
  workLocation: string
  purpose: 'self-use' | 'investment'
  propertyType: string[]
  timeline: string
  rejectedProjects: { id: string; reason: string }[]
  savedProjects: string[]
}
