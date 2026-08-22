import { Project, UnitConfig } from '@/types/project'

/** Normalizes a BHK label for loose comparison, e.g. "2 BHK Apartment" -> "2bhk" */
export function normalizeBhk(label: string): string {
  return (label || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Returns the unit configs in a project matching a given BHK label (e.g. "2BHK").
 * Matching is loose: "2BHK", "2 BHK Apartment", "2bhk-simplex" all match "2BHK".
 */
export function getMatchedUnitsForBhk(project: Project, bhk: string): UnitConfig[] {
  const target = normalizeBhk(bhk)
  return (project.unitConfigs || []).filter(u => normalizeBhk(u.type).startsWith(target))
}

/**
 * Returns the single representative (lowest-priced) unit for a BHK in a project,
 * or null if the project doesn't offer that BHK at all.
 */
export function getRepresentativeUnit(project: Project, bhk: string): UnitConfig | null {
  const matches = getMatchedUnitsForBhk(project, bhk)
  if (matches.length === 0) return null
  return matches.reduce((cheapest, u) => (u.price < cheapest.price ? u : cheapest), matches[0])
}
