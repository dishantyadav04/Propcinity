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
  floorPlan?: string   // URL to floor plan image for this config
  highlights: string[]
}

export interface Project {
  id: string
  slug: string
  name: string
  builder_id?: string
  builderName: string
  builderScore: number
  builderLogo?: string
  location: string
  city: string
  lat: number
  lng: number
  tagline: string
  description: string
  trustScore: number
  riskLabel: 'low' | 'medium' | 'high'
  reraId: string
  reraExpiry: string
  launchDate: string
  possessionDate: string
  totalUnits: number
  availableUnits: number
  unitConfigs: UnitConfig[]
  pros: string[]
  cons: string[]
  amenities: string[]
  images: string[]
  constructionStatus: 'pre_launch' | 'under_construction' | 'ready_to_move'
  constructionPercent: number
  isPublished: boolean
}
