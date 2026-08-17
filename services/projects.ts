import { createAdminSupabaseClient, createServerSupabaseClient, createStaticSupabaseClient } from '@/lib/supabase-server'
import { Project, UnitConfig, BuilderProject } from '@/types/project'
import { MOCK_PROJECTS } from '@/lib/mock-data'
import { deleteFromR2, cleanupRemovedR2Files } from '@/lib/r2'
import * as Sentry from '@sentry/nextjs'

function sanitizeDates(obj: Record<string, unknown>): Record<string, unknown> {
  const DATE_FIELDS = ['possession_date', 'rera_expiry', 'rera_possession_date', 'rera_link', 'brochure_url']
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      DATE_FIELDS.includes(k) && v === '' ? [k, null] : [k, v]
    )
  )
}

type SupabaseProjectRow = {
  id: string
  slug: string
  name: string
  builder_name: string
  builder_score: number
  builder_logo?: string
  builder_years_experience?: number
  builder_completed_projects?: number
  builder_cities?: string[]
  builder_top_projects?: unknown[]
  builder_description?: string
  location: string
  city: string
  lat: number
  lng: number
  tagline: string
  description: string
  rera_id: string
  rera_status?: string
  rera_expiry: string
  rera_link?: string
  possession_date: string
  rera_possession_date?: string
  updated_at?: string | null
  pros: string[] | null
  cons: string[] | null
  amenities: string[] | null
  internal_amenities?: string[]
  external_amenities?: string[]
  images: string[] | null
  construction_status: 'pre_launch' | 'under_construction' | 'ready_to_move'
  construction_percent: number
  is_published: boolean
  score_breakdown?: Record<string, number>
  rera_registrations?: unknown[]
  land_parcel_acres?: number
  total_towers?: number
  floors_per_tower?: string
  nearby_locations?: unknown[]
  master_plan_images?: string[]
  floor_plan_images?: string[]
  litigation?: boolean
  litigation_details?: string
  commencement_certificate?: boolean
  occupancy_certificate?: boolean
  legal_notes?: string
  payment_plans?: unknown[]
  bank_approvals?: unknown[]
  videos?: unknown[]
  brochure_url?: string
}

type SupabaseUnitConfigRow = {
  id: string
  type: string
  area: number
  price: number
  price_is_plus: boolean
  price_per_sqft: number
  floor_plan: string | null
  facing: string[] | null
  images: string[] | null
  highlights: string[] | null
  parking: number | null
  min_downpayment: number | null
}

function mapUnitConfig(row: SupabaseUnitConfigRow): UnitConfig {
  return {
    id: row.id,
    type: row.type,
    area: Number(row.area),
    price: Number(row.price),
    priceIsPlus: !!row.price_is_plus,
    pricePerSqFt: Number(row.price_per_sqft),
    facing: row.facing || [],
    floorPlan: row.floor_plan ?? undefined,
    highlights: row.highlights || [],
    minDownpayment: row.min_downpayment ?? undefined,
    parking: row.parking ?? undefined,
  }
}

function mapProject(row: SupabaseProjectRow & Record<string, unknown>, unitConfigs: SupabaseUnitConfigRow[]): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    builderName: row.builder_name,
    builderLogo: row.builder_logo,
    builderYearsExperience: row.builder_years_experience,
    builderCompletedProjects: row.builder_completed_projects,
    builderCities: row.builder_cities || [],
    builderTopProjects: (row.builder_top_projects || []) as BuilderProject[],
    builderDescription: row.builder_description,
    builderScore: row.builder_score,
    builderScoreBreakdown: row.score_breakdown,
    location: row.location,
    city: row.city,
    lat: Math.round(Number(row.lat) * 1000) / 1000,
    lng: Math.round(Number(row.lng) * 1000) / 1000,
    tagline: row.tagline,
    description: row.description,
    reraId: row.rera_id,
    reraExpiry: row.rera_expiry,
    reraLink: row.rera_link,
    reraStatus: (row.rera_status || 'not_registered') as Project['reraStatus'],
    possessionDate: row.possession_date,
    reraPossessionDate: row.rera_possession_date,
    updatedAt: row.updated_at ?? null,
    landParcelAcres: row.land_parcel_acres,
    totalTowers: row.total_towers,
    floorsPerTower: row.floors_per_tower,
    unitConfigs: unitConfigs.map(mapUnitConfig),
    pros: row.pros || [],
    cons: row.cons && row.cons.length > 0 ? row.cons : ['No major downside data available yet.'],
    amenities: row.amenities || [],
    internalAmenities: row.internal_amenities || [],
    externalAmenities: row.external_amenities || [],
    images: row.images || [],
    constructionStatus: row.construction_status,
    constructionPercent: row.construction_percent,
    litigation: !!row.litigation,
    litigationDetails: row.litigation_details,
    commencementCertificate: !!row.commencement_certificate,
    occupancyCertificate: !!row.occupancy_certificate,
    legalNotes: row.legal_notes,
    paymentPlans: (row.payment_plans || []) as Project['paymentPlans'],
    bankApprovals: (row.bank_approvals || []) as Project['bankApprovals'],
    videos: (row.videos || []) as Project['videos'],
    brochureUrl: row.brochure_url,
    nearbyLocations: (row.nearby_locations || []) as Project['nearbyLocations'],
    masterPlanImages: row.master_plan_images || [],
    floorPlanImages: row.floor_plan_images || [],
    reraRegistrations: (row.rera_registrations || []) as Project['reraRegistrations'],
    isPublished: row.is_published,
  }
}

async function fetchUnitConfigsByProjectIds(
  projectIds: string[]
): Promise<Map<string, SupabaseUnitConfigRow[]>> {
  if (!projectIds.length) return new Map()

  const supabase = await createServerSupabaseClient()
  if (!supabase) return new Map()
  const { data } = await supabase
    .from('unit_configs')
    .select('*')
    .in('project_id', projectIds)

  const grouped = new Map<string, SupabaseUnitConfigRow[]>()

  for (const row of (data || []) as (SupabaseUnitConfigRow & { project_id: string })[]) {
    const existing = grouped.get(row.project_id) || []
    existing.push(row)
    grouped.set(row.project_id, existing)
  }

  return grouped
}

export async function getPublishedProjects(filters?: {
  budgetMin?: number
  budgetMax?: number
  propertyTypes?: string[]
  excludeIds?: string[]
}): Promise<Project[]> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return MOCK_PROJECTS
    console.warn('[getPublishedProjects] Supabase client unavailable — missing env vars. Returning empty list.')
    return []
  }

  let query = supabase
    .from('projects_public')
    .select('*')
    .order('construction_percent', { ascending: false })

  if (filters?.excludeIds?.length) {
    query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`)
  }

  const { data: projects, error } = await query
  if (error) {
    console.error('[getPublishedProjects] Supabase error:', error.message, error.code)
    return []
  }
  if (!projects) return []

  const unitConfigMap = await fetchUnitConfigsByProjectIds(
    (projects as SupabaseProjectRow[]).map((project) => project.id)
  )

  const results: Project[] = []

  for (const project of projects as SupabaseProjectRow[]) {
    const unitConfigs = unitConfigMap.get(project.id) || []
    const matchingUnits = filters?.propertyTypes?.length
      ? unitConfigs.filter((unit) => filters.propertyTypes!.includes(unit.type))
      : unitConfigs

    if (matchingUnits.length === 0 && filters?.propertyTypes?.length) continue

    if (filters?.budgetMin || filters?.budgetMax) {
      const hasMatch = matchingUnits.some((unit) =>
        (!filters.budgetMin || Number(unit.price) >= filters.budgetMin) &&
        (!filters.budgetMax || Number(unit.price) <= filters.budgetMax)
      )

      if (!hasMatch) continue
    }

    results.push(mapProject(project, unitConfigs))
  }

  return results
}

// Build-time-safe variant for generateStaticParams. Fetches only slugs,
// via a cookie-free client, so it can run without a request context.
// Note: projects_public view already filters is_published=true at DB level.
export async function getPublishedProjectSlugs(): Promise<string[]> {
  const supabase = createStaticSupabaseClient()
  if (!supabase) {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      return MOCK_PROJECTS.map((p) => p.slug)
    }
    return []
  }

  const { data, error } = await supabase
    .from('projects_public')
    .select('slug')

  if (error) {
    console.error('[getPublishedProjectSlugs] Supabase error:', error.message, error.code)
    return []
  }

  return (data ?? []).map((row) => row.slug as string)
}

// Build-time/cookie-free variant for app/sitemap.ts. Fetches only slug +
// updated_at via the static client — sitemap.ts is statically rendered by
// Next.js and cannot use cookies(), so it must never call
// createServerSupabaseClient(). projects_public view already filters
// is_published=true at DB level.
export async function getPublishedProjectsForSitemap(): Promise<{ slug: string; updatedAt: string | null }[]> {
  const supabase = createStaticSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('projects_public')
    .select('slug, updated_at')

  if (error) {
    console.error('[getPublishedProjectsForSitemap] Supabase error:', error.message, error.code)
    return []
  }

  return (data ?? []).map((row) => ({ slug: row.slug as string, updatedAt: row.updated_at as string | null }))
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return MOCK_PROJECTS.find(p => p.slug === slug) || null
    return null
  }
  const { data: project, error } = await supabase
    .from('projects_public')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('[getProjectBySlug] Supabase error:', error.message, error.code)
    return null
  }
  if (!project) return null

  const unitConfigMap = await fetchUnitConfigsByProjectIds([project.id])
  return mapProject(project as SupabaseProjectRow, unitConfigMap.get(project.id) || [])
}

export async function getProjectsByIds(ids: string[]): Promise<Project[]> {
  if (!ids.length) return []

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return MOCK_PROJECTS.filter(p => ids.includes(p.id))
    return []
  }
  const { data: projects } = await supabase
    .from('projects_public')
    .select('*')
    .in('id', ids)

  if (!projects?.length) return []

  const unitConfigMap = await fetchUnitConfigsByProjectIds(
    (projects as SupabaseProjectRow[]).map((project) => project.id)
  )

  return (projects as SupabaseProjectRow[]).map((project) =>
    mapProject(project, unitConfigMap.get(project.id) || [])
  )
}

export async function adminGetAllProjects(page = 1, limit = 50, location?: string): Promise<{ projects: unknown[]; total: number; page: number; limit: number }> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') return { projects: MOCK_PROJECTS, total: MOCK_PROJECTS.length, page, limit }
    throw new Error('Admin Supabase client unavailable. Check SUPABASE_SERVICE_ROLE_KEY.')
  }
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('projects')
    .select('*, unit_configs(*)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (location && location.trim()) {
    query = query.ilike('location', `%${location.trim()}%`)
  }

  const { data, error, count } = await query.range(from, to)

  const mapped = (data || []).map((row: any) => ({
    ...row,
    // Explicit camelCase mappings — list page reads Project type (camelCase),
    // but the DB row spread only gives snake_case. Without these, values are undefined.
    isPublished: !!row.is_published,
    constructionStatus: row.construction_status,
    constructionPercent: row.construction_percent,
    unitConfigs: (row.unit_configs || []).map((u: any) => ({
      id: u.id,
      type: u.type,
      area: Number(u.area),
      price: Number(u.price),
      priceIsPlus: !!u.price_is_plus,
      pricePerSqFt: Number(u.price_per_sqft),
      facing: u.facing || [],
      floorPlan: u.floor_plan,
      highlights: u.highlights || [],
      minDownpayment: u.min_downpayment,
      parking: u.parking,
    })),
  }))
  return { projects: mapped, total: count ?? 0, page, limit }
}

export async function adminCreateProject(projectData: Record<string, unknown>): Promise<string> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { unitConfigs, ...project } = projectData as {
    unitConfigs?: Record<string, unknown>[]
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(sanitizeDates(project as Record<string, unknown>))
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message || 'Create failed')

  if (unitConfigs?.length) {
    const { error: unitError } = await supabase.from('unit_configs').insert(
      unitConfigs.map((unit) => ({ ...unit, project_id: data.id }))
    )
    if (unitError) {
      console.error('[adminCreateProject] unit_configs insert failed:', unitError.message)
      throw new Error(`unit_configs insert failed: ${unitError.message}`)
    }
  }

  return data.id
}

export async function adminUpdateProject(
  id: string,
  projectData: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return

  const {
    unitConfigs,
    // Strip camelCase fields — mapped to snake_case below
    builderName, builderLogo, builderYearsExperience, builderCompletedProjects,
    builderCities, builderTopProjects, builderDescription,
    reraId, reraExpiry, reraLink, reraStatus, possessionDate, reraPossessionDate,
    landParcelAcres, totalTowers, floorsPerTower,
    constructionStatus, constructionPercent,
    litigationDetails, commencementCertificate, occupancyCertificate, legalNotes,
    brochureUrl, paymentPlans, bankApprovals,
    nearbyLocations, internalAmenities, externalAmenities, reraRegistrations, masterPlanImages, floorPlanImages,
    ...project
  } = projectData as any

  // ── 1. Fetch existing image URLs from DB before overwriting ──────────────
  const { data: existing } = await supabase
    .from('projects')
    .select('images, master_plan_images, floor_plan_images, brochure_url, unit_configs(id, floor_plan, images)')
    .eq('id', id)
    .single()

  // Re-map camelCase fields that have DB columns to their snake_case equivalents
  const snakeMapped: Record<string, unknown> = {
    ...(nearbyLocations !== undefined && { nearby_locations: nearbyLocations }),
    ...(internalAmenities !== undefined && { internal_amenities: internalAmenities }),
    ...(externalAmenities !== undefined && { external_amenities: externalAmenities }),
    ...(reraRegistrations !== undefined && { rera_registrations: reraRegistrations }),
    ...(masterPlanImages !== undefined && { master_plan_images: masterPlanImages }),
    ...(floorPlanImages !== undefined && { floor_plan_images: floorPlanImages }),
    ...(reraStatus !== undefined && { rera_status: reraStatus }),
    ...(possessionDate !== undefined && { possession_date: possessionDate }),
    ...(reraPossessionDate !== undefined && { rera_possession_date: reraPossessionDate }),
    ...(constructionStatus !== undefined && { construction_status: constructionStatus }),
    ...(constructionPercent !== undefined && { construction_percent: constructionPercent }),
    ...(landParcelAcres !== undefined && { land_parcel_acres: landParcelAcres }),
    ...(totalTowers !== undefined && { total_towers: totalTowers }),
    ...(floorsPerTower !== undefined && { floors_per_tower: floorsPerTower }),
    ...(litigationDetails !== undefined && { litigation_details: litigationDetails }),
    ...(commencementCertificate !== undefined && { commencement_certificate: commencementCertificate }),
    ...(occupancyCertificate !== undefined && { occupancy_certificate: occupancyCertificate }),
    ...(legalNotes !== undefined && { legal_notes: legalNotes }),
    ...(brochureUrl !== undefined && { brochure_url: brochureUrl }),
    ...(paymentPlans !== undefined && { payment_plans: paymentPlans }),
    ...(bankApprovals !== undefined && { bank_approvals: bankApprovals }),
  }

  // ── 2. Write the update ──────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from('projects')
    .update(sanitizeDates({ ...project, ...snakeMapped } as Record<string, unknown>))
    .eq('id', id)

  if (updateError) {
    console.error('[adminUpdateProject] project update failed:', updateError.message)
    throw new Error(`Project update failed: ${updateError.message}`)
  }

  // ── 3. Handle unit_configs sync — diff by ID instead of delete+reinsert,
  //      so existing IDs (and any leads.unit_config_id referencing them)
  //      stay stable across edits. ────────────────────────────────────────
  if (unitConfigs !== undefined) {
    const existingUnits: { id: string }[] = ((existing as any)?.unit_configs ?? [])
    const existingIds = new Set(existingUnits.map((u) => u.id))
    const incoming = unitConfigs as Array<Record<string, unknown>>
    const incomingIds = new Set(incoming.filter((u) => u.id).map((u) => u.id as string))

    const idsToDelete = [...existingIds].filter((eid) => !incomingIds.has(eid))
    const toUpdate = incoming.filter((u) => u.id && existingIds.has(u.id as string))
    const toInsert = incoming.filter((u) => !u.id || !existingIds.has(u.id as string))

    if (idsToDelete.length) {
      const { error: delError } = await supabase
        .from('unit_configs')
        .delete()
        .in('id', idsToDelete)
      if (delError) {
        console.error('[adminUpdateProject] unit_configs delete failed:', delError.message)
        throw new Error(`unit_configs delete failed: ${delError.message}`)
      }
    }

    for (const unit of toUpdate) {
      const { id: unitId, ...patch } = unit
      const { error: updError } = await supabase
        .from('unit_configs')
        .update(patch)
        .eq('id', unitId as string)
      if (updError) {
        console.error('[adminUpdateProject] unit_configs update failed:', updError.message)
        throw new Error(`unit_configs update failed: ${updError.message}`)
      }
    }

    if (toInsert.length) {
      const { error: insError } = await supabase.from('unit_configs').insert(
        toInsert.map((unit) => {
          const { id: _drop, ...rest } = unit
          return { ...rest, project_id: id }
        })
      )
      if (insError) {
        console.error('[adminUpdateProject] unit_configs insert failed:', insError.message)
        throw new Error(`unit_configs insert failed: ${insError.message}`)
      }
    }
  }

  // ── 4. Diff and delete orphaned R2 images (fire-and-forget) ─────────────
  if (existing) {
    // Project-level image arrays
    if (masterPlanImages !== undefined) {
      cleanupRemovedR2Files(existing.master_plan_images ?? [], masterPlanImages).catch(() => { })
    }
    if (floorPlanImages !== undefined) {
      cleanupRemovedR2Files(existing.floor_plan_images ?? [], floorPlanImages).catch(() => { })
    }
    if (project.images !== undefined) {
      cleanupRemovedR2Files(existing.images ?? [], project.images as string[]).catch(() => { })
    }
    if (brochureUrl !== undefined) {
      cleanupRemovedR2Files(
        existing.brochure_url ? [existing.brochure_url] : [],
        brochureUrl ? [brochureUrl] : []
      ).catch(() => { })
    }

    // Unit config R2 files — diff old vs new floor_plan + images per unit
    if (unitConfigs !== undefined) {
      const oldUnits: any[] = (existing as any).unit_configs ?? []
      const oldFloorPlans = oldUnits.map((u: any) => u.floor_plan).filter(Boolean)
      const oldUnitImages = oldUnits.flatMap((u: any) => (u.images ?? []))
      const newFloorPlans = (unitConfigs as any[])
        .map((u) => u.floorPlan || u.floor_plan)
        .filter(Boolean)
      const newUnitImages = (unitConfigs as any[])
        .flatMap((u: any) => (u.images ?? []))
      cleanupRemovedR2Files(
        [...oldFloorPlans, ...oldUnitImages],
        [...newFloorPlans, ...newUnitImages]
      ).catch(() => { })
    }
  }
}

async function deleteR2UrlsAndLog(r2Urls: string[], context: string, projectId: string) {
  if (!r2Urls.length) return

  const results = await Promise.allSettled(r2Urls.map((url) => deleteFromR2(url)))
  let successCount = 0

  results.forEach((result, idx) => {
    const url = r2Urls[idx]
    if (result.status === 'rejected') {
      console.error(`[${context}] Rejected promise deleting URL: ${url}`, result.reason)
      Sentry.captureException(new Error(`Failed to delete R2 URL: ${url}. Promise rejected.`), {
        extra: { url, reason: result.reason, context, projectId }
      })
    } else {
      const delRes = result.value
      if (delRes.success) {
        successCount++
      } else {
        console.error(`[${context}] Failed to delete R2 URL: ${url}. Error:`, delRes.error)
        Sentry.captureException(new Error(`Failed to delete R2 URL: ${url}. R2 error.`), {
          extra: { url, error: delRes.error, context, projectId }
        })
      }
    }
  })

  console.info(`[${context}] R2 cleanup: ${successCount}/${r2Urls.length} deleted for project ${projectId}`)
}

export async function adminDeleteProject(id: string): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return

  // 1. Fetch project and its unit_configs to collect all R2 URLs before deletion
  const { data: project } = await supabase
    .from('projects')
    .select('images, master_plan_images, floor_plan_images, brochure_url, unit_configs(floor_plan, images)')
    .eq('id', id)
    .single()

  // 2. Delete the project row (unit_configs cascade via FK)
  await supabase.from('projects').delete().eq('id', id)

  // 3. Clean up R2 files — fire-and-forget, don't block on failures
  if (project) {
    const r2Urls: string[] = [
      ...(project.images ?? []),
      ...(project.master_plan_images ?? []),
      ...((project as any).floor_plan_images ?? []),
      ...(project.brochure_url ? [project.brochure_url] : []),
      ...((project as any).unit_configs ?? [])
        .flatMap((u: any) => [u.floor_plan, ...(u.images ?? [])])
        .filter(Boolean),
    ].filter((url: string) => url && url.startsWith('http'))

    // Run as fire-and-forget background task
    deleteR2UrlsAndLog(r2Urls, 'adminDeleteProject', id).catch((err) => {
      console.error('[adminDeleteProject] R2 cleanup background task failed:', err)
      Sentry.captureException(err)
    })
  }
}

export async function adminTogglePublished(id: string, isPublished: boolean): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return
  await supabase
    .from('projects')
    .update({ is_published: isPublished })
    .eq('id', id)
}