import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import {
  adminCreateProject,
  adminDeleteProject,
  adminGetAllProjects,
  adminTogglePublished,
  adminUpdateProject,
} from '@/services/projects'

const unauth = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const idSchema = z.object({
  id: z.string().uuid(),
})

const unitConfigSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot']),
  area: z.number(),
  price_min: z.number(),
  price_max: z.number(),
  available: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  floor_range: z.string(),
  facing: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  highlights: z.array(z.string()).optional().default([]),
})

const projectSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  builder_name: z.string().optional(),
  builder_score: z.number().int().min(0).max(100).optional(),
  builder_logo: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  trust_score: z.number().int().min(0).max(100).optional(),
  risk_label: z.enum(['low', 'medium', 'high']).optional(),
  rera_id: z.string().optional(),
  rera_expiry: z.string().optional(),
  launch_date: z.string().optional(),
  possession_date: z.string().optional(),
  total_units: z.number().int().optional(),
  available_units: z.number().int().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).min(1).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  construction_status: z.enum(['pre_launch', 'under_construction', 'ready_to_move']).optional(),
  construction_percent: z.number().int().min(0).max(100).optional(),
  commission_rate: z.number().optional(),
  is_published: z.boolean().optional(),
  nearby_locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    distance: z.string(),
  })).optional().default([]),
  internal_amenities: z.array(z.string()).optional().default([]),
  external_amenities: z.array(z.string()).optional().default([]),
  unitConfigs: z.array(unitConfigSchema).optional(),
})

const publishSchema = z.object({
  isPublished: z.boolean(),
})

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()
  return NextResponse.json({ projects: await adminGetAllProjects() })
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 })
  }

  const id = await adminCreateProject(parsed.data)
  return NextResponse.json({ success: true, id })
}

export async function PUT(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()

  const idParsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = projectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project payload' }, { status: 400 })
  }

  await adminUpdateProject(idParsed.data.id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()

  const parsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await adminDeleteProject(parsed.data.id)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthenticated(request)) return unauth()

  const idParsed = idSchema.safeParse({
    id: new URL(request.url).searchParams.get('id'),
  })
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid publish payload' }, { status: 400 })
  }

  await adminTogglePublished(idParsed.data.id, parsed.data.isPublished)
  return NextResponse.json({ success: true, isPublished: parsed.data.isPublished })
}
