export interface UserIntent {
  // Personal info
  name: string
  phone: string
  email: string
  // Location
  city: string                    // e.g. "Pune"
  subLocations: string[]          // e.g. ["Hinjewadi", "Wakad"]
  workLocation: string
  // Property preferences
  purpose: 'self-use' | 'investment' | 'both'
  propertyType: string[]
  bhkType: string[]               // e.g. ["2BHK", "3BHK"]
  budget: { min: number; max: number; isOpenMax?: boolean }
  timeline: 'under_1_year' | '1_to_2_years' | '3_to_5_years' | '5_plus'
  // Optional preferences
  preferences: string[]           // e.g. ["Gated community", "Near school"]
  // Legacy (keep for compatibility)
  location: string
  rejectedProjects: { id: string; reason: string }[]
  savedProjects: string[]
}
