import { Project, UnitConfig } from '@/types/project'
import { UserIntent } from '@/types/user'

// Score a project against user's intent (pure function, no localStorage)
export function scoreByIntent(project: Project, intent: any): number {
  if (!intent) return 0
  let score = 0

  // City must match
  if ((project.city || '').toLowerCase() !== (intent.city || 'pune').toLowerCase()) {
    return -1 // exclude
  }

  // Sub-location
  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase()
    const match = intent.subLocations.some((sl: string) => {
      const s = sl.toLowerCase()
      return pLoc.includes(s) || s.includes(pLoc)
    })
    score += match ? 30 : 5
  } else {
    score += 15
  }

  // Property type
  if (intent.propertyType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
    const match = intent.propertyType.some((sel: string) => {
      const s = sel.toLowerCase()
      if (s === 'apartment') return types.some((t: string) =>
        /^\d/.test(t) || t.includes('bhk') || t.includes('studio') || t.includes('rk')
      )
      if (s === 'villa') return types.some((t: string) =>
        t.includes('villa') || t.includes('row house')
      )
      if (s === 'plot') return types.some((t: string) => t.includes('plot'))
      return false
    })
    score += match ? 20 : 3
  } else {
    score += 10
  }

  // BHK
  if (intent.bhkType?.length > 0) {
    const types = (project.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
    const match = intent.bhkType.some((bhk: string) => {
      const b = bhk.toLowerCase()
      return types.some((t: string) => t === b || t.includes(b))
    })
    score += match ? 20 : 3
  } else {
    score += 10
  }

  // Budget
  if (intent.budget?.min > 0 || intent.budget?.max > 0) {
    const uMin = intent.budget.min || 0
    const uMax = intent.budget.isOpenMax ? Infinity : (intent.budget.max || Infinity)
    const prices = (project.unitConfigs || []).map((u: any) => u.priceMin).filter(Boolean)
    if (prices.length > 0) {
      const pMin = Math.min(...prices)
      const pMax = Math.max(...(project.unitConfigs || []).map((u: any) => u.priceMax || u.priceMin).filter(Boolean))
      score += (pMin <= uMax && pMax >= uMin) ? 20 : 2
    }
  } else {
    score += 10
  }

  // RERA status
  if (project.reraStatus === 'expired' || project.reraStatus === 'not_registered') {
    score -= 15
  } else if (project.reraStatus === 'registered') {
    score += 10
  }

  return score
}

export function getMatchPercent(project: Project, intent: any): number {
  const score = scoreByIntent(project, intent)
  return Math.min(100, Math.round((score / 90) * 100))
}

export interface MatchedUnitScore {
  percent: number
  budgetFit: 'under' | 'within' | 'over'
}

/**
 * Scores a SPECIFIC matched unit against intent (for compare page use), rather than
 * scoring the whole project's price range like scoreByIntent() does. Reuses the same
 * location/RERA weighting as scoreByIntent so the two stay consistent.
 */
export function scoreMatchedUnit(project: Project, unit: UnitConfig, intent: UserIntent): MatchedUnitScore {
  let score = 0

  // Location — same logic as scoreByIntent
  if (intent.subLocations?.length > 0) {
    const pLoc = (project.location || '').toLowerCase()
    const match = intent.subLocations.some((sl: string) => {
      const s = sl.toLowerCase()
      return pLoc.includes(s) || s.includes(pLoc)
    })
    score += match ? 30 : 5
  } else {
    score += 15
  }

  // Budget — computed against the SPECIFIC unit price, not project min/max
  let budgetFit: MatchedUnitScore['budgetFit'] = 'within'
  if (intent.budget?.min > 0 || intent.budget?.max > 0) {
    const uMin = intent.budget.min || 0
    const uMax = intent.budget.isOpenMax ? Infinity : (intent.budget.max || Infinity)
    if (unit.price < uMin) {
      budgetFit = 'under'
      score += 20
    } else if (unit.price <= uMax) {
      budgetFit = 'within'
      score += 25
    } else {
      budgetFit = 'over'
      score += unit.price <= uMax * 1.1 ? 10 : 2
    }
  } else {
    score += 15
  }

  // RERA — same logic as scoreByIntent
  if (project.reraStatus === 'expired' || project.reraStatus === 'not_registered') {
    score -= 15
  } else if (project.reraStatus === 'registered') {
    score += 10
  }

  return {
    percent: Math.max(0, Math.min(100, Math.round((score / 65) * 100))),
    budgetFit,
  }
}
