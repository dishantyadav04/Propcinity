// ── Propcinity Onboarding Matcher ─────────────────────────
// Clean progressive filtering system + smart fallback ranking

export type PropertyType = 'apartment' | 'villa' | 'plot' | 'penthouse'

export interface OnboardingState {
  city: string
  subLocations: string[]
  purpose: string
  propertyType: string[]
  bhkType: string[]
  budgetMin: number
  budgetMax: number
  isOpenMax: boolean
  timeline: string
  preferences: string[]
}

// ── Type classification helpers ────────────────────────────

export function classifyUnitType(unitType: string): PropertyType {
  const t = unitType.toLowerCase()
  if (t.includes('plot')) return 'plot'
  if (t.includes('villa') || t.includes('row house') || t.includes('bungalow')) return 'villa'
  if (t.includes('penthouse')) return 'penthouse'
  // Anything with a number + BHK, studio, RK, duplex = apartment
  return 'apartment'
}

export function getProjectTypes(project: any): Set<PropertyType> {
  const types = new Set<PropertyType>()
  ;(project.unitConfigs || []).forEach((u: any) => {
    types.add(classifyUnitType(u.type || ''))
  })
  return types
}

export function getBHKNumbers(project: any): number[] {
  const nums: number[] = []
  ;(project.unitConfigs || []).forEach((u: any) => {
    const t = (u.type || '').toLowerCase()
    const match = t.match(/^(\d+(?:\.\d+)?)/)
    if (match) nums.push(parseFloat(match[1]))
  })
  return nums
}

export function getBHKLabel(bhkType: string): number | null {
  const match = bhkType.toLowerCase().match(/^(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

// ── Location matching ──────────────────────────────────────

export function locationMatches(projectLocation: string, subLocations: string[]): boolean {
  if (subLocations.length === 0) return true
  const pLoc = projectLocation.toLowerCase()
  return subLocations.some(sl => {
    const s = sl.toLowerCase()
    return pLoc.includes(s) || s.includes(pLoc)
  })
}

// ── Budget helpers ─────────────────────────────────────────

export function projectPriceRange(project: any): { min: number; max: number } | null {
  const configs = project.unitConfigs || []
  if (configs.length === 0) return null
  const mins = configs.map((u: any) => u.priceMin).filter(Boolean)
  const maxs = configs.map((u: any) => u.priceMax || u.priceMin).filter(Boolean)
  if (mins.length === 0) return null
  return { min: Math.min(...mins), max: Math.max(...maxs) }
}

export function budgetOverlaps(
  projMin: number, projMax: number,
  userMin: number, userMax: number
): boolean {
  // Range [projMin, projMax] overlaps [userMin, userMax]
  return projMin <= userMax && projMax >= userMin
}

// ── Timeline helpers ───────────────────────────────────────

export function getMonthsTopossession(possessionDate: string): number {
  const now = new Date()
  const poss = new Date(possessionDate)
  return Math.round((poss.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
}

export function timelineMatches(project: any, timeline: string): boolean {
  if (!timeline || !project.possessionDate) return true
  const months = getMonthsToPosition(project.possessionDate)
  if (months <= 0) return true // already delivered — matches everything
  switch (timeline) {
    case 'under_1_year':  return months <= 14
    case '1_to_2_years':  return months <= 30
    case '3_to_5_years':  return months <= 66
    case '5_plus':        return true
    default:              return true
  }
}

// Fix typo — use this everywhere
function getMonthsToPosition(possessionDate: string): number {
  return getMonthsTopossession(possessionDate)
}

// ── MAIN PROGRESSIVE FILTER ────────────────────────────────
// Returns the count at the current step, following the exact
// logic described:
// Step 2: city → sublocation filter
// Step 3: purpose = no filter change (display step only)
// Step 4: property type filter (sum of all types = pool before)
// Step 5: BHK filter (sum of all BHK options = pool before)
// Step 6: budget filter (union across ranges, count once)
// Step 7: timeline filter (sum of all options = pool before)

export function getMatchingCount(
  projects: any[],
  state: OnboardingState,
  currentStep: number
): number {
  let pool = [...projects]

  // Step 2+ — city
  pool = pool.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )

  // Step 2+ — sub-locations (only if selected)
  if (state.subLocations.length > 0) {
    pool = pool.filter(p => locationMatches(p.location || '', state.subLocations))
  }

  // Step 3 — purpose: NO filter, count stays same
  // (Purpose affects scoring, not filtering)

  // Step 4+ — property type
  if (currentStep >= 4 && state.propertyType.length > 0) {
    const typeFiltered = pool.filter(p => {
      const projTypes = getProjectTypes(p)
      return state.propertyType.some(sel =>
        projTypes.has(sel.toLowerCase() as PropertyType)
      )
    })
    // Always apply — if user selected something, filter by it
    pool = typeFiltered
  }

  // Step 5+ — BHK type
  if (currentStep >= 5 && state.bhkType.length > 0) {
    const bhkFiltered = pool.filter(p => {
      const projBHKs = getBHKNumbers(p)
      const projTypes = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
      return state.bhkType.some(sel => {
        const selNum = getBHKLabel(sel)
        const selLow = sel.toLowerCase()
        // Exact string match first
        if (projTypes.some((t: string) => t === selLow || t.includes(selLow))) return true
        // Numeric match
        if (selNum !== null && projBHKs.includes(selNum)) return true
        return false
      })
    })
    pool = bhkFiltered
  }

  // Step 6+ — budget (union logic: each project counted once even if it
  // falls in multiple ranges)
  const userHasBudget = state.budgetMin > 0 || state.budgetMax > 0
  if (currentStep >= 6 && userHasBudget) {
    const userMin = state.budgetMin || 0
    const userMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
    const budgetFiltered = pool.filter(p => {
      const range = projectPriceRange(p)
      if (!range) return true // no price data — include
      return budgetOverlaps(range.min, range.max, userMin, userMax)
    })
    // Budget is a hard filter — if user set a budget, apply it
    pool = budgetFiltered
  }

  // Step 7+ — timeline (soft: never drops to 0)
  if (currentStep >= 7 && state.timeline) {
    const tlFiltered = pool.filter(p => timelineMatches(p, state.timeline))
    // Only apply if result > 0
    if (tlFiltered.length > 0) pool = tlFiltered
  }

  return pool.length
}

// ── COUNT PER OPTION (for showing counts on buttons) ──────

// Count for each property type option (step 4)
// Input: pool BEFORE type filter (after city+subloc)
export function countsByPropertyType(
  projects: any[],
  state: OnboardingState
): Record<PropertyType, number> {
  // Build pool up to step 3 (city + subloc, no type filter)
  let pool = projects.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )
  if (state.subLocations.length > 0) {
    pool = pool.filter(p => locationMatches(p.location || '', state.subLocations))
  }

  const counts: Record<PropertyType, number> = {
    apartment: 0, villa: 0, plot: 0, penthouse: 0
  }
  pool.forEach(p => {
    const seen = new Set<PropertyType>()
    ;(p.unitConfigs || []).forEach((u: any) => {
      const t = classifyUnitType(u.type || '')
      if (!seen.has(t)) {
        counts[t]++
        seen.add(t)
      }
    })
  })
  // VERIFY: sum of all counts should equal pool.length
  // (some projects may appear in multiple categories if they have mixed configs)
  return counts
}

// Count for each BHK option (step 5)
// Input: pool AFTER type filter
export function countsByBHK(
  projects: any[],
  state: OnboardingState,
  bhkOptions: string[]
): Record<string, number> {
  // Build pool up to step 4 (city + subloc + type filter)
  let pool = projects.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )
  if (state.subLocations.length > 0) {
    pool = pool.filter(p => locationMatches(p.location || '', state.subLocations))
  }
  if (state.propertyType.length > 0) {
    pool = pool.filter(p => {
      const projTypes = getProjectTypes(p)
      return state.propertyType.some(sel =>
        projTypes.has(sel.toLowerCase() as PropertyType)
      )
    })
  }

  const counts: Record<string, number> = {}
  bhkOptions.forEach(bhk => {
    const selNum = getBHKLabel(bhk)
    const selLow = bhk.toLowerCase()
    counts[bhk] = pool.filter(p => {
      const projBHKs = getBHKNumbers(p)
      const projTypes = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
      if (projTypes.some((t: string) => t === selLow || t.includes(selLow))) return true
      if (selNum !== null && projBHKs.includes(selNum)) return true
      return false
    }).length
  })
  return counts
}

// Count for each budget option (step 6)
// Note: uses UNION — project counted once per option it falls in
export function countsByBudget(
  projects: any[],
  state: OnboardingState,
  budgetOptions: { min: number; max: number; label: string }[]
): Record<string, number> {
  // Build pool up to step 5
  let pool = projects.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )
  if (state.subLocations.length > 0) {
    pool = pool.filter(p => locationMatches(p.location || '', state.subLocations))
  }
  if (state.propertyType.length > 0) {
    pool = pool.filter(p => {
      const projTypes = getProjectTypes(p)
      return state.propertyType.some(sel =>
        projTypes.has(sel.toLowerCase() as PropertyType)
      )
    })
  }
  if (state.bhkType.length > 0) {
    pool = pool.filter(p => {
      const projBHKs = getBHKNumbers(p)
      const projTypes = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
      return state.bhkType.some(sel => {
        const selNum = getBHKLabel(sel)
        const selLow = sel.toLowerCase()
        if (projTypes.some((t: string) => t === selLow || t.includes(selLow))) return true
        if (selNum !== null && projBHKs.includes(selNum)) return true
        return false
      })
    })
  }

  const counts: Record<string, number> = {}
  budgetOptions.forEach(opt => {
    const uMax = opt.max === Infinity ? Infinity : opt.max
    counts[opt.label] = pool.filter(p => {
      const range = projectPriceRange(p)
      if (!range) return false
      return budgetOverlaps(range.min, range.max, opt.min, uMax)
    }).length
  })
  return counts
}

// Count for each timeline option (step 7)
export function countsByTimeline(
  projects: any[],
  state: OnboardingState,
  timelineOptions: { id: string; label: string }[]
): Record<string, number> {
  // Build pool up to step 6
  let pool = projects.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )
  if (state.subLocations.length > 0) {
    pool = pool.filter(p => locationMatches(p.location || '', state.subLocations))
  }
  if (state.propertyType.length > 0) {
    pool = pool.filter(p => {
      const projTypes = getProjectTypes(p)
      return state.propertyType.some(sel =>
        projTypes.has(sel.toLowerCase() as PropertyType)
      )
    })
  }
  if (state.bhkType.length > 0) {
    pool = pool.filter(p => {
      const projBHKs = getBHKNumbers(p)
      const projTypes = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
      return state.bhkType.some(sel => {
        const selNum = getBHKLabel(sel)
        const selLow = sel.toLowerCase()
        if (projTypes.some((t: string) => t === selLow || t.includes(selLow))) return true
        if (selNum !== null && projBHKs.includes(selNum)) return true
        return false
      })
    })
  }
  const userMin = state.budgetMin || 0
  const userMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
  if (state.budgetMin > 0 || state.budgetMax > 0) {
    pool = pool.filter(p => {
      const range = projectPriceRange(p)
      if (!range) return true
      return budgetOverlaps(range.min, range.max, userMin, userMax)
    })
  }

  const counts: Record<string, number> = {}
  timelineOptions.forEach(opt => {
    counts[opt.id] = pool.filter(p => timelineMatches(p, opt.id)).length
  })
  return counts
}

// ── DASHBOARD RANKING ──────────────────────────────────────
// Scores each project 0-100 based on how well it matches
// all criteria, then fills to MIN_RESULTS with best fallbacks

export interface MatchResult {
  project: any
  score: number          // 0-100
  matchPct: number       // displayed as "X% match"
  tier: 'exact' | 'close' | 'fallback'
  reasons: string[]
  flags: string[]
}

const MIN_DASHBOARD = 10 // always show at least 10 on dashboard

export function rankProjects(
  projects: any[],
  state: OnboardingState
): MatchResult[] {

  const scored: MatchResult[] = []

  for (const p of projects) {
    let score = 0
    const reasons: string[] = []
    const flags: string[] = []

    // ── Location (0-25) ────────────────────────────────────
    const cityMatch = (p.city || '').toLowerCase() === state.city.toLowerCase()
    if (!cityMatch) {
      score += 0
    } else if (state.subLocations.length > 0) {
      if (locationMatches(p.location || '', state.subLocations)) {
        score += 25
        reasons.push(`In ${p.location}`)
      } else {
        score += 10 // city match but not sub-location
        flags.push('Outside your preferred area')
      }
    } else {
      score += 20 // city match, no sub-location preference
      reasons.push('In your city')
    }

    // ── Property type (0-20) ───────────────────────────────
    if (state.propertyType.length > 0) {
      const projTypes = getProjectTypes(p)
      const typeMatch = state.propertyType.some(sel =>
        projTypes.has(sel.toLowerCase() as PropertyType)
      )
      if (typeMatch) {
        score += 20
        reasons.push('Matches your property type')
      } else {
        score += 5
        flags.push('Different property type')
      }
    } else {
      score += 15 // no preference
    }

    // ── BHK (0-20) ─────────────────────────────────────────
    if (state.bhkType.length > 0) {
      const projBHKs = getBHKNumbers(p)
      const projTypes = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase())
      const exactBHK = state.bhkType.some(sel => {
        const selNum = getBHKLabel(sel)
        const selLow = sel.toLowerCase()
        if (projTypes.some((t: string) => t === selLow || t.includes(selLow))) return true
        if (selNum !== null && projBHKs.includes(selNum)) return true
        return false
      })

      if (exactBHK) {
        score += 20
        reasons.push('Has your preferred configuration')
      } else {
        // Partial credit for close BHK (adjacent sizes)
        const preferredNums = state.bhkType.map(b => getBHKLabel(b)).filter(n => n !== null) as number[]
        const closest = preferredNums.reduce((best, pref) => {
          const diff = Math.min(...projBHKs.map(b => Math.abs(b - pref)))
          return Math.min(best, diff)
        }, Infinity)

        if (closest <= 1) {
          score += 10  // adjacent BHK (e.g. want 2BHK, has 3BHK)
          flags.push('Similar configuration available')
        } else {
          score += 3
          flags.push('Different configuration')
        }
      }
    } else {
      score += 15
    }

    // ── Budget (0-20) ──────────────────────────────────────
    const userHasBudget = state.budgetMin > 0 || state.budgetMax > 0
    if (userHasBudget) {
      const userMin = state.budgetMin || 0
      const userMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
      const range = projectPriceRange(p)

      if (!range) {
        score += 10 // no price info
      } else if (budgetOverlaps(range.min, range.max, userMin, userMax)) {
        score += 20
        reasons.push('Within your budget')
      } else {
        // How far is it?
        const gap = range.min > userMax
          ? range.min - userMax   // project is more expensive
          : userMin - range.max   // project is cheaper
        const gapPct = gap / Math.max(userMax, 1)
        if (gapPct <= 0.2) {
          score += 8  // within 20% of budget
          flags.push('Slightly outside budget')
        } else if (gapPct <= 0.5) {
          score += 3
          flags.push('Outside budget range')
        } else {
          score += 0
          flags.push('Significantly outside budget')
        }
      }
    } else {
      score += 15
    }

    // ── Timeline (0-10) ────────────────────────────────────
    if (state.timeline) {
      if (timelineMatches(p, state.timeline)) {
        score += 10
        reasons.push('Available in your timeline')
      } else {
        score += 3
        flags.push('Possession beyond your timeline')
      }
    } else {
      score += 8
    }

    // ── Trust bonus (0-5) ──────────────────────────────────
    if ((p.trustScore || 0) >= 80) score += 5
    else if ((p.trustScore || 0) >= 65) score += 3
    else if ((p.trustScore || 0) >= 50) score += 1

    // Calculate match percentage (0-100)
    const maxPossible = 100
    const matchPct = Math.min(100, Math.round(score))

    // Tier: exact = all primary criteria match, close = most match, fallback = partial
    const primaryScore = score - (score >= 90 ? 5 : 0) // exclude trust bonus for tier
    const tier: MatchResult['tier'] =
      primaryScore >= 80 ? 'exact' :
      primaryScore >= 50 ? 'close' :
      'fallback'

    scored.push({ project: p, score, matchPct, tier, reasons, flags })
  }

  // Sort: highest match first
  scored.sort((a, b) => b.score - a.score)

  // ── Smart fallback to fill MIN_DASHBOARD slots ─────────
  // Strategy: if fewer than MIN_DASHBOARD exact/close matches,
  // fill with best fallbacks in this priority order:
  // 1. Same city, bigger BHK (e.g. want 2BHK → suggest 3BHK first)
  // 2. Same city, smaller BHK but lower budget
  // 3. Same city, any type

  const exactClose = scored.filter(r => r.tier !== 'fallback')
  const fallbacks = scored.filter(r => r.tier === 'fallback')

  if (exactClose.length >= MIN_DASHBOARD) {
    return exactClose.slice(0, MIN_DASHBOARD)
  }

  // Need fallbacks — sort them smartly
  const preferredBHKNums = state.bhkType.map(b => getBHKLabel(b)).filter(n => n !== null) as number[]
  const maxPreferredBHK = preferredBHKNums.length > 0 ? Math.max(...preferredBHKNums) : 2

  fallbacks.sort((a, b) => {
    const aScore = fallbackPriority(a.project, maxPreferredBHK, state)
    const bScore = fallbackPriority(b.project, maxPreferredBHK, state)
    return bScore - aScore
  })

  const needed = MIN_DASHBOARD - exactClose.length
  const result = [...exactClose, ...fallbacks.slice(0, needed)]
  return result
}

function fallbackPriority(project: any, maxPreferredBHK: number, state: OnboardingState): number {
  let p = 0
  const projBHKs = getBHKNumbers(project)
  const userMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
  const range = projectPriceRange(project)

  // Priority 1: larger BHK in same budget (more value for money)
  if (projBHKs.some(b => b > maxPreferredBHK)) {
    p += 30
    // But only if budget is close
    if (range && range.min <= userMax * 1.15) p += 20
  }

  // Priority 2: smaller BHK but cheaper (budget alternative)
  if (projBHKs.some(b => b < maxPreferredBHK)) {
    p += 15
    if (range && range.min < (state.budgetMin || 0) * 0.9) p += 10 // meaningfully cheaper
  }

  // Trust score bonus
  p += Math.round((project.trustScore || 0) / 10)

  return p
}
