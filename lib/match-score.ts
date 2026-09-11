import { Project, UnitConfig } from '@/types/project'
import { UserIntent } from '@/types/user'

const CORE_WEIGHTS = { location: 25, propertyType: 10, bhk: 20, budget: 25, timeline: 10 } // sums to 90
const PREFERENCES_BONUS = 10 // additive, on top of the 90

export const TIER_GREAT = 70
export const TIER_GOOD = 50
export const TIER_FAIR = 30
export const MIN_RECOMMENDED_SCORE = TIER_FAIR // floor for even appearing in "Top Picks"

function budgetFitRatio(pMin: number, pMax: number, uMin: number, uMax: number): number {
  if (!pMin && !pMax) return 0.5 // no price data — don't penalize or reward blindly
  if (pMax <= uMin && uMin > 0) return 1 // cheaper than your minimum — fine, that's a bargain
  if (pMin <= uMax) return 1 // ranges overlap — within budget
  const tolerance = (uMax === Infinity ? pMin : uMax) * 0.15
  const overBy = pMin - (uMax === Infinity ? pMin : uMax)
  return Math.max(0, 1 - overBy / (tolerance || 1))
}

function timelineFitRatio(project: Project, timeline?: UserIntent['timeline']): number {
  if (!timeline) return 0.5
  let yearsOut = 2 // fallback estimate
  if (project.constructionStatus === 'ready_to_move') yearsOut = 0
  else if (project.possessionDate) {
    const target = new Date(project.possessionDate).getTime()
    if (!isNaN(target)) yearsOut = Math.max(0, (target - Date.now()) / (365 * 24 * 3600 * 1000))
  } else {
    yearsOut = { pre_launch: 4, new_launch: 2.5, under_construction: 1.5, ready_to_move: 0 }[project.constructionStatus] ?? 2
  }
  const ranges: Record<string, [number, number]> = {
    under_1_year: [0, 1], '1_to_2_years': [1, 2], '3_to_5_years': [3, 5], '5_plus': [5, 99],
  }
  const [lo, hi] = ranges[timeline] ?? [0, 99]
  if (yearsOut <= hi) return 1 // on time or earlier than needed
  return Math.max(0, 1 - (yearsOut - hi) / 2) // taper 0.5/yr late
}

function qualityMultiplier(project: Project): number {
  let m = { registered: 1, pending: 0.95, expired: 0.75, not_registered: 0.55 }[project.reraStatus] ?? 0.8
  if (project.litigation) m *= 0.7
  return m
}

export interface MatchDetails {
  percent: number
  tier: 'great' | 'good' | 'fair' | 'poor'
  excluded: boolean
}

export function getMatchDetails(project: Project, intent: any): MatchDetails {
  if (!intent) return { percent: 0, tier: 'poor', excluded: true }
  if ((project.city || '').toLowerCase() !== (intent.city || 'pune').toLowerCase()) {
    return { percent: 0, tier: 'poor', excluded: true }
  }

  const types = (project.unitConfigs || []).map(u => (u.type || '').toLowerCase())
  let weightSum = 0
  let weighted = 0

  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase()
    const match = intent.subLocations.some((sl: string) => pLoc.includes(sl.toLowerCase()) || sl.toLowerCase().includes(pLoc))
    weighted += CORE_WEIGHTS.location * (match ? 1 : 0.3); weightSum += CORE_WEIGHTS.location
  }
  if (intent.propertyType?.length > 0) {
    const match = intent.propertyType.some((sel: string) => {
      const s = sel.toLowerCase()
      if (s === 'apartment') return types.some(t => /^\d/.test(t) || t.includes('bhk') || t.includes('studio') || t.includes('rk'))
      if (s === 'villa') return types.some(t => t.includes('villa') || t.includes('row house'))
      if (s === 'plot') return types.some(t => t.includes('plot'))
      return false
    })
    weighted += CORE_WEIGHTS.propertyType * (match ? 1 : 0.2); weightSum += CORE_WEIGHTS.propertyType
  }
  if (intent.bhkType?.length > 0) {
    const BHK_ORDER = ['1bhk', '2bhk', '3bhk', '4bhk', '5bhk']
    const exact = intent.bhkType.some((bhk: string) => types.some(t => t === bhk.toLowerCase() || t.includes(bhk.toLowerCase())))
    const adjacent = !exact && intent.bhkType.some((bhk: string) => {
      const idx = BHK_ORDER.indexOf(bhk.toLowerCase())
      return [BHK_ORDER[idx - 1], BHK_ORDER[idx + 1]].filter(Boolean).some(ab => types.some(t => t.includes(ab)))
    })
    weighted += CORE_WEIGHTS.bhk * (exact ? 1 : adjacent ? 0.5 : 0); weightSum += CORE_WEIGHTS.bhk
  }
  if (intent.budget?.min > 0 || intent.budget?.max > 0) {
    const uMin = intent.budget.min || 0
    const uMax = intent.budget.isOpenMax ? Infinity : (intent.budget.max || Infinity)
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin ?? u.price).filter(Boolean)
    const pMin = prices.length ? Math.min(...prices) : 0
    const pMax = prices.length ? Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax ?? u.price).filter(Boolean)) : 0
    weighted += CORE_WEIGHTS.budget * budgetFitRatio(pMin, pMax, uMin, uMax); weightSum += CORE_WEIGHTS.budget
  }
  if (intent.timeline) {
    weighted += CORE_WEIGHTS.timeline * timelineFitRatio(project, intent.timeline); weightSum += CORE_WEIGHTS.timeline
  }

  const coreScore = weightSum > 0 ? (weighted / weightSum) * 90 : 60 // fallback if nothing specified yet

  let bonus = 0
  if (intent.preferences?.length > 0) {
    const haystack = [...(project.amenities||[]), ...(project.internalAmenities||[]), ...(project.externalAmenities||[]), ...(project.pros||[])]
      .join(' ').toLowerCase()
    const hits = intent.preferences.filter((p: string) => haystack.includes(p.toLowerCase())).length
    bonus = (hits / intent.preferences.length) * PREFERENCES_BONUS
  }

  const raw = Math.min(100, coreScore + bonus)
  const percent = Math.round(raw * qualityMultiplier(project))
  const tier = percent >= TIER_GREAT ? 'great' : percent >= TIER_GOOD ? 'good' : percent >= TIER_FAIR ? 'fair' : 'poor'
  return { percent, tier, excluded: false }
}

// Legacy-compatible wrappers so existing callers don't need to change shape
export function scoreByIntent(project: Project, intent: any): number {
  return getMatchDetails(project, intent).percent
}
export function getMatchPercent(project: Project, intent: any): number {
  return getMatchDetails(project, intent).percent
}

export interface MatchedUnitScore { percent: number; budgetFit: 'under' | 'within' | 'over' }
export function scoreMatchedUnit(project: Project, unit: UnitConfig, intent: UserIntent): MatchedUnitScore {
  const base = getMatchDetails(project, intent)
  const uMin = intent.budget?.min || 0
  const uMax = intent.budget?.isOpenMax ? Infinity : (intent.budget?.max || Infinity)
  const budgetFit: MatchedUnitScore['budgetFit'] = unit.price < uMin ? 'under' : unit.price <= uMax ? 'within' : 'over'
  return { percent: base.percent, budgetFit }
}
