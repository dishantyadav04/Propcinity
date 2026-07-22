import { z } from 'zod'

export const unitConfigSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().min(1),
  area: z.number(),
  price: z.number(),
  price_is_plus: z.boolean().optional().default(false),
  price_per_sqft: z.number().optional(),
  facing: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  highlights: z.array(z.string()).optional().default([]),
  parking: z.number().optional(),
  min_downpayment: z.number().optional(),
  floor_plan: z.string().optional(),
})

export const projectSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  builder_name: z.string().optional(),
  builder_id: z.string().uuid().optional().nullable(),
  builder_score: z.number().int().min(0).max(100).optional(),
  builder_logo: z.string().optional(),
  builder_years_experience: z.number().int().optional().nullable(),
  builder_completed_projects: z.number().int().optional().nullable(),
  builder_cities: z.array(z.string()).optional().default([]),
  builder_top_projects: z.array(z.object({ name: z.string(), location: z.string() })).optional().default([]),
  builder_description: z.string().optional().nullable(),
  location: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  rera_status: z.enum(['registered', 'expired', 'pending', 'not_registered']).optional(),
  rera_id: z.string().optional(),
  rera_expiry: z.string().optional().nullable().transform(v => v === '' ? null : v ?? null),
  rera_link: z.string().optional().nullable(),
  possession_date: z.string().optional().transform(v => v === '' ? null : v),
  rera_possession_date: z.string().optional().nullable().transform(v => v === '' ? null : v ?? null),
  land_parcel_acres: z.number().optional().nullable(),
  total_towers: z.number().int().optional().nullable(),
  floors_per_tower: z.string().optional().nullable(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).min(1).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  construction_status: z.enum(['pre_launch', 'new_launch', 'under_construction', 'ready_to_move']).optional(),
  construction_percent: z.number().int().min(0).max(100).optional(),
  litigation: z.boolean().optional().default(false),
  litigation_details: z.string().optional().nullable(),
  commencement_certificate: z.boolean().optional().nullable(),
  occupancy_certificate: z.boolean().optional().nullable(),
  legal_notes: z.string().optional().nullable(),
  payment_plans: z.array(z.object({ name: z.string(), description: z.string() })).optional().default([]),
  bank_approvals: z.array(z.object({ bankName: z.string(), logoUrl: z.string().optional() })).optional().default([]),
  videos: z.array(z.object({ label: z.string(), youtubeUrl: z.string() })).optional().default([]),
  brochure_url: z.string().optional().nullable(),
  is_published: z.boolean().optional(),
  nearby_locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    distance: z.string(),
  })).optional().default([]),
  internal_amenities: z.array(z.string()).optional().default([]),
  external_amenities: z.array(z.string()).optional().default([]),
  rera_registrations: z.array(z.object({
    id: z.string(),
    reraId: z.string(),
    reraLink: z.string().optional(),
    description: z.string().optional(),
  })).optional().default([]),
  master_plan_images: z.array(z.string()).optional().default([]),
  floor_plan_images: z.array(z.string()).optional().default([]),
  unitConfigs: z.array(unitConfigSchema).optional(),
})

export type ProjectPayload = z.infer<typeof projectSchema>
export type UnitConfigPayload = z.infer<typeof unitConfigSchema>

export function flattenZodError(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {}
  const formErrors: string[] = []

  for (const issue of error.issues) {
    if (issue.path.length > 0) {
      const pathStr = issue.path.join('.')
      if (!fieldErrors[pathStr]) {
        fieldErrors[pathStr] = []
      }
      fieldErrors[pathStr].push(issue.message)
    } else {
      formErrors.push(issue.message)
    }
  }

  return { fieldErrors, formErrors }
}
