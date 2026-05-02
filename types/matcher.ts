export interface UnitConfig {
  id: string
  type: string
  area: number
  priceMin: number
  priceMax: number
  pricePerSqFt: number
  available: number
  total: number
  floor: string
  facing: string[]
  images: string[]
  floorPlan?: string
  highlights: string[]
}

export interface MatcherState {
  city: string
  subLocations: string[]
  purpose: string
  propertyType: string[]
  bhkType: string[]
  budgetMin: number
  budgetMax: number
  isOpenMax: boolean
  timeline: string
  preferences: string[]
}

export interface MatchResult {
  project: any
  score: number
  matchPct: number
  tier: 'exact' | 'close' | 'fallback'
  reasons: string[]
  flags: string[]
}
