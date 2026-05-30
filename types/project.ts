export interface UnitConfig {
  id: string
  type: string            // "2BHK", "3BHK", "3.5BHK" etc.
  area: number            // carpet area in sqft
  priceMin: number
  priceMax: number
  pricePerSqFt: number
  floor?: string
  facing?: string[]
  floorPlan?: string      // URL to floor plan image
  highlights?: string[]
  maintenancePerMonth?: number
  parking?: number        // number of parking spots for this config
}

export interface BuilderProject {
  name: string
  location: string
}

export interface PaymentPlan {
  name: string            // "CLP", "Flexi Plan", "Subvention"
  description: string
}

export interface BankApproval {
  bankName: string
  logoUrl?: string
}

export interface ProjectVideo {
  label: string           // "Teaser", "3.5BHK Sample Flat", "Overview"
  youtubeUrl: string
}

export interface ManualNearbyLocation {
  id: string
  name: string
  category: 'school' | 'hospital' | 'mall' | 'metro' | 'it_park' | 'park' | 'restaurant' | 'bank' | 'pharmacy' | 'other'
  distance: string   // e.g. "700m", "1.2 km"
}

export interface AmenityLibraryItem {
  id: string
  name: string
  icon: string       // emoji
  category: 'internal' | 'external' | 'both'
}

export interface ReraRegistration {
  id: string
  reraId: string          // e.g. "P52100047931"
  reraLink?: string       // link to maharera.mahaonline.gov.in
  description?: string    // e.g. "Tower 1–2", "Phase 1"
}

export interface Project {
  id: string
  slug: string
  name: string
  builder_id?: string
  builderName: string
  builderLogo?: string
  builderYearsExperience?: number
  builderCompletedProjects?: number
  builderCities?: string[]
  builderTopProjects?: BuilderProject[]
  builderDescription?: string
  location: string
  city: string
  lat: number
  lng: number
  tagline: string
  description: string

  // Removed: trustScore, builderScore, riskLabel

  // RERA
  reraId: string
  reraExpiry?: string
  reraLink?: string

  // Dates
  launchDate: string
  possessionDate: string        // Target possession
  reraPossessionDate?: string   // RERA possession

  // Project specs
  landParcelAcres?: number      // e.g. 7.5
  totalTowers?: number          // e.g. 6
  floorsPerTower?: string       // e.g. "G+33"
  totalUnits: number
  availableUnits?: number

  // Config summary (derived from unitConfigs)
  unitConfigs: UnitConfig[]

  // Content
  pros: string[]
  cons: string[]
  amenities: string[]
  internalAmenities?: string[]
  externalAmenities?: string[]
  nearbyLocations?: ManualNearbyLocation[]
  masterPlanImages?: string[]          // project-level master layout images
  reraRegistrations?: ReraRegistration[]  // multiple RERA numbers
  images: string[]

  // Status
  constructionStatus: 'pre_launch' | 'new_launch' | 'under_construction' | 'ready_to_move'
  constructionPercent: number

  // Legal
  litigation: boolean           // true = has litigation
  litigationDetails?: string
  commencementCertificate?: boolean
  occupancyCertificate?: boolean
  legalNotes?: string

  // Financial
  paymentPlans?: PaymentPlan[]
  bankApprovals?: BankApproval[]

  // Media
  videos?: ProjectVideo[]
  brochureUrl?: string

  isPublished: boolean
}
