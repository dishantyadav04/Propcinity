// ─────────────────────────────────────────────────────────
// Propcinity Onboarding Matcher — Clean Rewrite
// ─────────────────────────────────────────────────────────

export interface MatcherState {
  city: string
  subLocations: string[]          // e.g. ["Wakad", "Baner"]
  purpose: string                 // "self-use" | "investment" | "both"
  propertyType: string[]          // ["apartment"] | ["villa"] | etc.
  bhkType: string[]               // ["2BHK"] | ["3BHK", "2BHK"] etc.
  budgetMin: number               // in rupees, 0 = not set
  budgetMax: number               // in rupees, 0 = not set
  isOpenMax: boolean              // true = 10Cr+
  timeline: string                // "under_1_year" | "1_to_2_years" etc.
  preferences: string[]           // soft, never blocks
}

export interface MatchResult {
  project: any
  score: number       // 0–100 raw
  matchPct: number    // 0–100 displayed
  tier: 'exact' | 'close' | 'fallback'
  reasons: string[]
  flags: string[]
}

// ─────────────────────────────────────────────────────────
// CLASSIFIERS
// Every unit type in mock data maps to one of these.
// Handles: "2BHK", "3BHK Villa", "4.5BHK", "Duplex 3BHK",
//          "Plot", "Studio", "1RK", "3BHK Row House" etc.
// ─────────────────────────────────────────────────────────

function getPropertyCategory(unitType: string): string {
  const t = unitType.toLowerCase().trim()
  if (t.includes('plot')) return 'plot'
  if (t.includes('villa') || t.includes('row house') || t.includes('bungalow')) return 'villa'
  if (t.includes('penthouse')) return 'penthouse'
  // Everything else: apartment (BHK, Studio, RK, Duplex, etc.)
  return 'apartment'
}

// Returns all categories a project has (a project can have both apartment + villa configs)
function getProjectCategories(project: any): string[] {
  const cats = new Set<string>()
  ;(project.unitConfigs || []).forEach((u: any) => {
    cats.add(getPropertyCategory(u.type || ''))
  })
  return Array.from(cats)
}

// Extract numeric BHK value from a unit type string
// "2BHK" → 2, "2.5BHK" → 2.5, "Duplex 3BHK" → 3,
// "3BHK Villa" → 3, "4BHK+" → 4, "Studio" → 0.5, "1RK" → 0.5
function extractBHKNum(unitType: string): number | null {
  const t = unitType.toLowerCase().trim()
  // Match leading number: "2bhk", "2.5bhk", "duplex 3bhk", "3bhk villa"
  const leadingNum = t.match(/(\d+(?:\.\d+)?)/)
  if (leadingNum) return parseFloat(leadingNum[1])
  if (t.includes('studio') || t.includes('rk')) return 0.5
  return null
}

// Get all BHK numbers a project has across all its unit configs
function getProjectBHKNums(project: any): number[] {
  const nums: number[] = []
  ;(project.unitConfigs || []).forEach((u: any) => {
    const n = extractBHKNum(u.type || '')
    if (n !== null) nums.push(n)
  })
  return [...new Set(nums)]
}

// Parse the user's BHK selection into a number
// "2BHK" → 2, "4BHK+" → 4.5 (means >=4), "Studio" → 0.5
function parseBHKSelection(bhkType: string): number {
  const t = bhkType.toLowerCase().trim()
  if (t === '4bhk+') return 4.5       // 4+ means 4, 4.5, 5, etc.
  if (t.includes('studio') || t.includes('rk')) return 0.5
  const m = t.match(/^(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : -1
}

// Check if a project has a unit matching user's BHK selection
function projectMatchesBHK(project: any, bhkType: string): boolean {
  const selNum = parseBHKSelection(bhkType)
  const projNums = getProjectBHKNums(project)
  if (selNum < 0) return false
  if (bhkType === '4BHK+') {
    // 4BHK+ means anything >= 4
    return projNums.some(n => n >= 4)
  }
  // Direct numeric match
  return projNums.some(n => n === selNum)
}

// ─────────────────────────────────────────────────────────
// LOCATION
// ─────────────────────────────────────────────────────────

function locationMatchesSub(projectLocation: string, subLocations: string[]): boolean {
  if (subLocations.length === 0) return true
  const pLoc = projectLocation.toLowerCase()
  return subLocations.some(sl => {
    const s = sl.toLowerCase()
    return pLoc.includes(s) || s.includes(pLoc)
  })
}

// ─────────────────────────────────────────────────────────
// PRICE
// ─────────────────────────────────────────────────────────

function getProjectPriceRange(project: any): { min: number; max: number } | null {
  const configs = project.unitConfigs || []
  if (configs.length === 0) return null
  const mins = configs.map((u: any) => u.priceMin).filter((v: any) => v > 0)
  const maxs = configs.map((u: any) => u.priceMax || u.priceMin).filter((v: any) => v > 0)
  if (mins.length === 0) return null
  return { min: Math.min(...mins), max: Math.max(...maxs) }
}

function priceRangesOverlap(
  pMin: number, pMax: number,
  uMin: number, uMax: number
): boolean {
  return pMin <= uMax && pMax >= uMin
}

// ─────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────

function getMonthsToDate(dateStr: string): number {
  const now = new Date()
  const d = new Date(dateStr)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
}

function projectMatchesTimeline(project: any, timeline: string): boolean {
  if (!timeline || !project.possessionDate) return true
  const months = getMonthsToDate(project.possessionDate)
  if (months <= 0) return true  // already delivered — matches everything
  switch (timeline) {
    case 'under_1_year':  return months <= 14
    case '1_to_2_years':  return months <= 30
    case '3_to_5_years':  return months <= 66
    case '5_plus':        return true   // long-term = anything qualifies
    default:              return true
  }
}

// ─────────────────────────────────────────────────────────
// PROGRESSIVE POOL BUILDER
// Builds the filtered pool step by step.
// Each step only narrows the pool further (never widens).
// Exception: timeline is soft (never drops to 0).
// ─────────────────────────────────────────────────────────

function buildPool(allProjects: any[], state: MatcherState, upToStep: number): any[] {
  let pool = [...allProjects]

  // Always: city filter
  pool = pool.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )

  // Step 2+: sub-location (only if user selected any)
  if (state.subLocations.length > 0) {
    pool = pool.filter(p => locationMatchesSub(p.location || '', state.subLocations))
  }

  // Step 3: purpose — NO filtering (purpose only affects scoring)

  // Step 4+: property type (only if selected)
  if (upToStep >= 4 && state.propertyType.length > 0) {
    const filtered = pool.filter(p => {
      const cats = getProjectCategories(p)
      return state.propertyType.some(sel => cats.includes(sel.toLowerCase()))
    })
    pool = filtered  // hard filter — user explicitly chose a type
  }

  // Step 5+: BHK type (only if selected)
  if (upToStep >= 5 && state.bhkType.length > 0) {
    const filtered = pool.filter(p =>
      state.bhkType.some(bhk => projectMatchesBHK(p, bhk))
    )
    pool = filtered  // hard filter — user explicitly chose BHK
  }

  // Step 6+: budget (only if user set a non-zero budget)
  const hasBudget = state.budgetMin > 0 || state.budgetMax > 0
  if (upToStep >= 6 && hasBudget) {
    const uMin = state.budgetMin > 0 ? state.budgetMin : 0
    const uMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
    const filtered = pool.filter(p => {
      const range = getProjectPriceRange(p)
      if (!range) return true    // no price data — include (benefit of the doubt)
      return priceRangesOverlap(range.min, range.max, uMin, uMax)
    })
    pool = filtered  // hard filter — user set a budget
  }

  // Step 7+: timeline (SOFT — never drops to 0)
  if (upToStep >= 7 && state.timeline) {
    const filtered = pool.filter(p => projectMatchesTimeline(p, state.timeline))
    if (filtered.length > 0) pool = filtered
    // If filtered is empty, keep the pool as-is (soft filter)
  }

  return pool
}

// ─────────────────────────────────────────────────────────
// PUBLIC: getMatchingCount
// Returns the count for the current step.
// ─────────────────────────────────────────────────────────

export function getMatchingCount(
  projects: any[],
  state: MatcherState,
  currentStep: number
): number {
  return buildPool(projects, state, currentStep).length
}

// ─────────────────────────────────────────────────────────
// PUBLIC: countsByPropertyType
// For step 4 buttons — how many projects match each type
// from the pool AFTER city+sublocation (before type filter).
// ─────────────────────────────────────────────────────────

export function countsByPropertyType(
  projects: any[],
  state: MatcherState
): Record<string, number> {
  // Pool up to step 3 (city + subloc, no type filter)
  const pool = buildPool(projects, { ...state, propertyType: [] }, 3)
  const result: Record<string, number> = {
    apartment: 0, villa: 0, plot: 0, penthouse: 0
  }
  pool.forEach(p => {
    const cats = getProjectCategories(p)
    cats.forEach(c => {
      if (c in result) result[c]++
    })
  })
  return result
}

// ─────────────────────────────────────────────────────────
// PUBLIC: countsByBHK
// For step 5 buttons — how many projects match each BHK
// from the pool AFTER type filter.
// ─────────────────────────────────────────────────────────

export function countsByBHK(
  projects: any[],
  state: MatcherState,
  bhkOptions: string[]
): Record<string, number> {
  // Pool up to step 4 (includes type filter, no BHK filter)
  const pool = buildPool(projects, { ...state, bhkType: [] }, 4)
  const result: Record<string, number> = {}
  bhkOptions.forEach(bhk => {
    result[bhk] = pool.filter(p => projectMatchesBHK(p, bhk)).length
  })
  return result
}

// ─────────────────────────────────────────────────────────
// PUBLIC: countsByBudget
// For step 6 — how many projects match each budget range
// from the pool AFTER BHK filter (union logic — project
// counted once per range even if it spans multiple).
// ─────────────────────────────────────────────────────────

export function countsByBudget(
  projects: any[],
  state: MatcherState,
  budgetOptions: { label: string; min: number; max: number }[]
): Record<string, number> {
  // Pool up to step 5
  const pool = buildPool(projects, { ...state, budgetMin: 0, budgetMax: 0, isOpenMax: false }, 5)
  const result: Record<string, number> = {}
  budgetOptions.forEach(opt => {
    const uMax = opt.max === Infinity ? Infinity : opt.max
    result[opt.label] = pool.filter(p => {
      const range = getProjectPriceRange(p)
      if (!range) return false
      return priceRangesOverlap(range.min, range.max, opt.min, uMax)
    }).length
  })
  return result
}

// ─────────────────────────────────────────────────────────
// PUBLIC: countsByTimeline
// For step 7 — how many projects match each timeline
// from the pool AFTER budget filter.
// ─────────────────────────────────────────────────────────

export function countsByTimeline(
  projects: any[],
  state: MatcherState,
  timelineOptions: { id: string; label: string }[]
): Record<string, number> {
  // Pool up to step 6
  const pool = buildPool(projects, { ...state, timeline: '' }, 6)
  const result: Record<string, number> = {}
  timelineOptions.forEach(opt => {
    result[opt.id] = pool.filter(p => projectMatchesTimeline(p, opt.id)).length
  })
  return result
}

// ─────────────────────────────────────────────────────────
// PUBLIC: rankProjects
// Scores every project 0-100 and returns sorted list.
// Fills to MIN_COUNT with best fallbacks using smart priority.
// ─────────────────────────────────────────────────────────

const MIN_DASHBOARD = 10

export function rankProjects(
  projects: any[],
  state: MatcherState
): MatchResult[] {
  // Step 1: Base City Filter
  const cityPool = projects.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )

  // Step 2: Score All Projects in City
  const scored: MatchResult[] = cityPool.map(p => scoreProject(p, state))
  scored.sort((a, b) => b.score - a.score)

  // Step 3: Separate Strict Matches (Score >= 90)
  const strictMatches = scored.filter(r => r.score >= 90)

  if (strictMatches.length >= MIN_DASHBOARD) {
    return strictMatches.slice(0, MIN_DASHBOARD)
  }

  // Step 4: Execute Fallback Pipeline
  let finalResults = [...strictMatches]
  const fallbackPool = scored.filter(r => r.score < 90)
  const usedIds = new Set(finalResults.map(r => r.project.id))

  const addResults = (results: MatchResult[]) => {
    for (const r of results) {
      if (!usedIds.has(r.project.id)) {
        finalResults.push(r)
        usedIds.add(r.project.id)
      }
    }
  }

  // LEVEL 1: Configuration Relaxation (Budget & Location Fixed)
  // Has slightly different config, but fits budget and location perfectly.
  const level1 = fallbackPool.filter(r => 
    r.reasons.includes('Matches your budget') && 
    (r.reasons.includes('In your preferred area') || r.reasons.includes('In your city')) &&
    r.reasons.includes('Matches your property type')
  )
  level1.sort((a, b) => b.score - a.score)
  addResults(level1)
  if (finalResults.length >= MIN_DASHBOARD) return finalResults.slice(0, MIN_DASHBOARD)

  // LEVEL 2: Budget Expansion (Config & Location Fixed)
  // Has slightly higher/lower budget, but exact config and location.
  const level2 = fallbackPool.filter(r =>
    r.flags.includes('Slightly outside budget') &&
    r.reasons.includes('Matches your configuration') &&
    (r.reasons.includes('In your preferred area') || r.reasons.includes('In your city'))
  )
  level2.sort((a, b) => b.score - a.score)
  addResults(level2)
  if (finalResults.length >= MIN_DASHBOARD) return finalResults.slice(0, MIN_DASHBOARD)

  // LEVEL 3: Location Expansion (Budget & Config Fixed)
  // Exact budget and config, but slightly different location.
  const level3 = fallbackPool.filter(r =>
    r.flags.includes('Outside preferred area') &&
    r.reasons.includes('Matches your configuration') &&
    r.reasons.includes('Matches your budget')
  )
  level3.sort((a, b) => b.score - a.score)
  addResults(level3)
  if (finalResults.length >= MIN_DASHBOARD) return finalResults.slice(0, MIN_DASHBOARD)

  // LEVEL 4: Property Type Relaxation
  const level4 = fallbackPool.filter(r =>
    r.flags.includes('Different property type')
  )
  level4.sort((a, b) => b.score - a.score)
  addResults(level4)
  if (finalResults.length >= MIN_DASHBOARD) return finalResults.slice(0, MIN_DASHBOARD)

  // Pad with highest remaining scores if still under 10
  const remaining = fallbackPool.filter(r => !usedIds.has(r.project.id))
  remaining.sort((a, b) => b.score - a.score)
  addResults(remaining)

  return finalResults.slice(0, MIN_DASHBOARD)
}

// ─────────────────────────────────────────────────────────
// INTERNAL: scoreProject (100-Point Formula)
// ─────────────────────────────────────────────────────────

function scoreProject(project: any, state: MatcherState): MatchResult {
  let score = 0
  const reasons: string[] = []
  const flags: string[] = []

  const projCats = getProjectCategories(project)
  const projBHKs = getProjectBHKNums(project)
  const priceRange = getProjectPriceRange(project)

  // ── Location (25 pts) ──────────────────────────────────
  if (state.subLocations.length > 0) {
    if (locationMatchesSub(project.location || '', state.subLocations)) {
      score += 25
      reasons.push('In your preferred area')
    } else {
      score += 0   
      flags.push('Outside preferred area')
    }
  } else {
    score += 25     // city match, no sub-location set
    reasons.push('In your city')
  }

  // ── Property type (15 pts) ─────────────────────────────
  if (state.propertyType.length > 0) {
    const typeMatch = state.propertyType.some(sel => projCats.includes(sel.toLowerCase()))
    if (typeMatch) {
      score += 15
      reasons.push('Matches your property type')
    } else {
      score += 0
      flags.push('Different property type')
    }
  } else {
    score += 15   // no preference set
    reasons.push('Matches your property type')
  }

  // ── BHK (20 pts) ───────────────────────────────────────
  if (state.bhkType.length > 0) {
    const exactBHK = state.bhkType.some(bhk => projectMatchesBHK(project, bhk))
    if (exactBHK) {
      score += 20
      reasons.push('Matches your configuration')
    } else {
      // Fallback +1 or -1 BHK
      const preferredNums = state.bhkType.map(b => parseBHKSelection(b)).filter(n => n > 0)
      
      let isPlusOne = false
      let isMinusOne = false
      
      projBHKs.forEach(b => {
        if (preferredNums.some(pref => b > pref && b <= pref + 1.5)) isPlusOne = true
        if (preferredNums.some(pref => b < pref && b >= pref - 1.5)) isMinusOne = true
      })

      if (isPlusOne) {
        score += 10
        flags.push('Slightly larger configuration')
      } else if (isMinusOne) {
        score += 5
        flags.push('Slightly smaller configuration')
      } else {
        score += 0
        flags.push('Different configuration')
      }
    }
  } else {
    score += 20
    reasons.push('Matches your configuration')
  }

  // ── Budget (25 pts) ────────────────────────────────────
  const hasBudget = state.budgetMin > 0 || state.budgetMax > 0
  if (hasBudget) {
    const uMin = state.budgetMin > 0 ? state.budgetMin : 0
    const uMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)

    if (!priceRange) {
      score += 15   // no price info — neutral
    } else if (priceRangesOverlap(priceRange.min, priceRange.max, uMin, uMax)) {
      score += 25
      reasons.push('Matches your budget')
    } else if (priceRangesOverlap(priceRange.min, priceRange.max, uMin * 0.9, uMax * 1.15)) {
      score += 15
      flags.push('Slightly outside budget')
    } else {
      score += 0
      flags.push('Significantly outside budget')
    }
  } else {
    score += 25   // no budget set
    reasons.push('Matches your budget')
  }

  // ── Timeline (10 pts) ───────────────────────────────────
  if (state.timeline) {
    if (projectMatchesTimeline(project, state.timeline)) {
      score += 10
      reasons.push('Within your timeline')
    } else {
      score += 0
      flags.push('Possession beyond your timeline')
    }
  } else {
    score += 10
  }

  // ── Soft Preferences / Trust (5 pts) ──────────────────────────
  const trust = project.trustScore || 0
  if (trust >= 80) { score += 5; reasons.push('Highly trusted builder') }
  else if (trust >= 65) score += 3
  else if (trust >= 50) score += 1
  else flags.push('Lower trust score')

  // fractional tiebreaker for sorting
  const finalScore = Math.min(100, score + (trust / 1000))

  const tier: MatchResult['tier'] =
    score >= 90 ? 'exact' :
    score >= 60 ? 'close' :
    'fallback'

  return {
    project,
    score: finalScore,
    matchPct: Math.floor(score), // display purely based on integer score
    tier,
    reasons,
    flags,
  }
}
