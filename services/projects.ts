import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { Project, UnitConfig } from '@/types/project'
import { MOCK_PROJECTS } from '@/lib/mock-data'

type SupabaseProjectRow = {
  id: string
  slug: string
  name: string
  builder_name: string
  builder_score: number
  builder_logo?: string
  location: string
  city: string
  lat: number
  lng: number
  tagline: string
  description: string
  trust_score: number
  risk_label: 'low' | 'medium' | 'high'
  rera_id: string
  rera_expiry: string
  launch_date: string
  possession_date: string
  total_units: number
  available_units: number
  pros: string[] | null
  cons: string[] | null
  amenities: string[] | null
  images: string[] | null
  construction_status: 'pre_launch' | 'under_construction' | 'ready_to_move'
  construction_percent: number
  is_published: boolean
}

type SupabaseUnitConfigRow = {
  id: string
  type: string
  area: number
  price_min: number
  price_max: number
  price_per_sqft: number
  available: number
  total: number
  floor_range: string
  facing: string[] | null
  images: string[] | null
  highlights: string[] | null
}

function mapUnitConfig(row: SupabaseUnitConfigRow): UnitConfig {
  return {
    id: row.id,
    type: row.type,
    area: Number(row.area),
    priceMin: Number(row.price_min),
    priceMax: Number(row.price_max),
    pricePerSqFt: Number(row.price_per_sqft),
    available: row.available,
    total: row.total,
    floor: row.floor_range,
    facing: row.facing || [],
    images: row.images || [],
    highlights: row.highlights || [],
  }
}

function mapProject(row: SupabaseProjectRow, unitConfigs: SupabaseUnitConfigRow[]): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    builderName: row.builder_name,
    builderScore: row.builder_score,
    builderLogo: row.builder_logo,
    location: row.location,
    city: row.city,
    lat: Number(row.lat),
    lng: Number(row.lng),
    tagline: row.tagline,
    description: row.description,
    trustScore: row.trust_score,
    riskLabel: row.risk_label,
    reraId: row.rera_id,
    reraExpiry: row.rera_expiry,
    launchDate: row.launch_date,
    possessionDate: row.possession_date,
    totalUnits: row.total_units,
    availableUnits: row.available_units,
    unitConfigs: unitConfigs.map(mapUnitConfig),
    pros: row.pros || [],
    cons: row.cons && row.cons.length > 0 ? row.cons : ['No major downside data available yet.'],
    amenities: row.amenities || [],
    images: row.images || [],
    constructionStatus: row.construction_status,
    constructionPercent: row.construction_percent,
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
    console.log('Using mock data for getPublishedProjects')
    return MOCK_PROJECTS
  }

  let query = supabase
    .from('projects_public')
    .select('*')
    .order('trust_score', { ascending: false })

  if (filters?.excludeIds?.length) {
    query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`)
  }

  const { data: projects, error } = await query
  if (error || !projects) return []

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
        (!filters.budgetMin || Number(unit.price_max) >= filters.budgetMin) &&
        (!filters.budgetMax || Number(unit.price_min) <= filters.budgetMax)
      )

      if (!hasMatch) continue
    }

    results.push(mapProject(project, unitConfigs))
  }

  return results
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return MOCK_PROJECTS.find(p => p.slug === slug) || null
  }
  const { data: project, error } = await supabase
    .from('projects_public')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !project) return null

  const unitConfigMap = await fetchUnitConfigsByProjectIds([project.id])
  return mapProject(project as SupabaseProjectRow, unitConfigMap.get(project.id) || [])
}

export async function getProjectsByIds(ids: string[]): Promise<Project[]> {
  if (!ids.length) return []

  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    return MOCK_PROJECTS.filter(p => ids.includes(p.id))
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

export async function saveProject(userId: string, projectId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return
  await supabase
    .from('saved_projects')
    .upsert({ user_id: userId, project_id: projectId })
}

export async function unsaveProject(userId: string, projectId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return
  await supabase
    .from('saved_projects')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId)
}

export async function getSavedProjects(userId: string): Promise<Project[]> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('saved_projects')
    .select('project_id')
    .eq('user_id', userId)

  if (!data?.length) return []
  return getProjectsByIds(data.map((row) => row.project_id))
}

export async function rejectProject(
  userId: string,
  projectId: string,
  reason: string
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  if (!supabase) return
  await supabase
    .from('rejected_projects')
    .upsert({ user_id: userId, project_id: projectId, reason })
}

export async function adminGetAllProjects(): Promise<unknown[]> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return MOCK_PROJECTS
  const { data } = await supabase
    .from('projects')
    .select('*, unit_configs(*)')
    .order('created_at', { ascending: false })

  return data || []
}

export async function adminCreateProject(projectData: Record<string, unknown>): Promise<string> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) throw new Error('Supabase not configured')
  const { unitConfigs, ...project } = projectData as {
    unitConfigs?: Record<string, unknown>[]
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message || 'Create failed')

  if (unitConfigs?.length) {
    await supabase.from('unit_configs').insert(
      unitConfigs.map((unit) => ({ ...unit, project_id: data.id }))
    )
  }

  return data.id
}

export async function adminUpdateProject(
  id: string,
  projectData: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return
  const { unitConfigs, ...project } = projectData as {
    unitConfigs?: Record<string, unknown>[]
  }

  await supabase
    .from('projects')
    .update(project)
    .eq('id', id)

  if (unitConfigs !== undefined) {
    await supabase
      .from('unit_configs')
      .delete()
      .eq('project_id', id)

    if (unitConfigs.length) {
      await supabase.from('unit_configs').insert(
        unitConfigs.map((unit) => ({ ...unit, project_id: id }))
      )
    }
  }
}

export async function adminDeleteProject(id: string): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return
  await supabase
    .from('projects')
    .delete()
    .eq('id', id)
}

export async function adminTogglePublished(id: string, isPublished: boolean): Promise<void> {
  const supabase = createAdminSupabaseClient()
  if (!supabase) return
  await supabase
    .from('projects')
    .update({ is_published: isPublished })
    .eq('id', id)
}
