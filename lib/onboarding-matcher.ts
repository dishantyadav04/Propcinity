import type { MatcherState, MatchResult } from '@/types/matcher'

// ─────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────

function getPropertyCategory(unitType: string): string {
  const t = unitType.toLowerCase().trim()
  if (t.includes('plot')) return 'plot'
  if (t.includes('villa') || t.includes('row house') || t.includes('bungalow')) return 'villa'
  if (t.includes('penthouse')) return 'penthouse'
  return 'apartment'
}

function getProjectCategories(project: any): string[] {
  const cats = new Set<string>()
  ;(project.unitConfigs || []).forEach((u: any) => {
    cats.add(getPropertyCategory(u.type || ''))
  })
  return Array.from(cats)
}

function extractBHKNum(unitType: string): number | null {
  const t = unitType.toLowerCase().trim()
  const leadingNum = t.match(/(\d+(?:\.\d+)?)/)
  if (leadingNum) return parseFloat(leadingNum[1])
  if (t.includes('studio') || t.includes('rk')) return 0
  return null
}

function getProjectBHKNums(project: any): number[] {
  const nums: number[] = []
  if (project.bhk !== undefined && project.bhk !== null) {
    const configs = Array.isArray(project.bhk) ? project.bhk : [project.bhk]
    configs.forEach((val: any) => {
      if (typeof val === 'number') nums.push(val)
      else if (typeof val === 'string') {
        const n = extractBHKNum(val)
        if (n !== null) nums.push(n)
      }
    })
  }
  ;(project.unitConfigs || []).forEach((u: any) => {
    const n = extractBHKNum(u.type || '')
    if (n !== null) nums.push(n)
  })
  return [...new Set(nums)]
}

function parseBHKSelection(bhkType: string): number {
  const t = bhkType.toLowerCase().trim()
  if (t === '4bhk+') return 5
  if (t.includes('studio') || t.includes('rk')) return 0
  const m = t.match(/^(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : -1
}

function getProjectBHKCategories(project: any): string[] {
  const nums = getProjectBHKNums(project)
  if (nums.length === 0) {
    const isPlot = getProjectCategories(project).includes('plot')
    if (!isPlot && (project.unitConfigs || []).length > 0) {
      console.error(`[BHK Error] Project ${project.id} (${project.name}) has unitConfigs but no recognizable BHKs.`, project.unitConfigs)
    }
    return []
  }

  const cats = new Set<string>()
  nums.forEach(n => {
    if (n === 0 || n < 1) cats.add("Studio")
    else if (n === 1) cats.add("1BHK")
    else if (n === 2) cats.add("2BHK")
    else if (n === 3) cats.add("3BHK")
    else if (n === 4) cats.add("4BHK")
    else if (n > 4) cats.add("4BHK+")
    else {
      const floorN = Math.floor(n)
      if (floorN === 1) cats.add("1BHK")
      else if (floorN === 2) cats.add("2BHK")
      else if (floorN === 3) cats.add("3BHK")
      else if (floorN === 4) cats.add("4BHK")
      else if (n > 4) cats.add("4BHK+")
    }
  })
  return Array.from(cats)
}

function projectMatchesBHK(project: any, bhkSelection: string): boolean {
  if (bhkSelection.toLowerCase().includes('sqft')) return true 
  const projectCats = getProjectBHKCategories(project)
  return projectCats.includes(bhkSelection)
}

function locationMatchesSub(projectLocation: string, subLocations: string[]): boolean {
  if (subLocations.length === 0) return true
  const pLoc = projectLocation.toLowerCase()
  return subLocations.some(sl => {
    const s = sl.toLowerCase()
    return pLoc.includes(s) || s.includes(pLoc)
  })
}

function getProjectBasePrice(project: any): number {
  const configs = project.unitConfigs || []
  if (configs.length === 0) return 0
  const mins = configs.map((u: any) => u.priceMin).filter((v: any) => v > 0)
  return mins.length > 0 ? Math.min(...mins) : 0
}

function getPossessionYears(dateStr: string): number {
  if (!dateStr) return 0
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = d.getTime() - now.getTime()
  if (diffMs <= 0) return 0
  return diffMs / (1000 * 60 * 60 * 24 * 365.25)
}

function projectMatchesTimeline(project: any, timeline: string): boolean {
  if (!timeline) return true
  const years = getPossessionYears(project.possessionDate)
  switch (timeline) {
    case 'under_1_year':  return years <= 1
    case '1_to_2_years':  return years > 1 && years <= 2
    case '3_to_5_years':  return years > 2 && years <= 5
    case '5_plus':        return years > 5
    default:              return true
  }
}

function buildPool(allProjects: any[], state: MatcherState, upToStep: number): any[] {
  let currentProjects = [...allProjects]
  let previousStepProjects = [...currentProjects]

  currentProjects = currentProjects.filter(p =>
    (p.city || '').toLowerCase() === state.city.toLowerCase()
  )

  if (state.subLocations.length > 0) {
    currentProjects = currentProjects.filter(p => locationMatchesSub(p.location || '', state.subLocations))
  }

  if (upToStep >= 4 && state.propertyType.length > 0) {
    currentProjects = currentProjects.filter(p => {
      const cats = getProjectCategories(p)
      return state.propertyType.some(sel => cats.includes(sel.toLowerCase()))
    })
  }

  if (upToStep >= 5 && state.bhkType.length > 0) {
    const isBHKSelection = !state.bhkType[0].toLowerCase().includes('sqft')
    currentProjects = currentProjects.filter(p =>
      state.bhkType.some(bhk => projectMatchesBHK(p, bhk))
    )

    if (isBHKSelection) {
      const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', '4BHK+', 'Studio']
      const isAllSelected = BHK_OPTIONS.every(opt => state.bhkType.includes(opt))
      if (isAllSelected) {
        const dropped = previousStepProjects.filter(p => !currentProjects.includes(p))
        const residentialDropped = dropped.filter(p => !getProjectCategories(p).includes('plot'))
        if (residentialDropped.length > 0) {
          console.warn(`[BHK Coverage Warning] ${residentialDropped.length} residential projects lost after selecting ALL BHK options.`, 
            residentialDropped.map(p => ({ id: p.id, name: p.name, categories: getProjectBHKCategories(p) }))
          )
        }
      }
    }
  }

  if (upToStep >= 6 && (state.budgetMin > 0 || state.budgetMax > 0)) {
    const uMin = state.budgetMin > 0 ? state.budgetMin : 0
    const uMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
    currentProjects = currentProjects.filter(p => {
      const price = getProjectBasePrice(p)
      if (!price) return true
      return price >= uMin && price <= uMax
    })
  }

  if (upToStep >= 7 && state.timeline) {
    currentProjects = currentProjects.filter(p => projectMatchesTimeline(p, state.timeline))
  }

  console.log(`[buildPool Step ${upToStep}] CURRENT PROJECTS COUNT:`, currentProjects.length)
  return currentProjects
}

function scoreProject(project: any, state: MatcherState): MatchResult {
  let score = 0
  const reasons: string[] = []
  const flags: string[] = []

  const projCats = getProjectCategories(project)
  const projBHKs = getProjectBHKNums(project)
  const basePrice = getProjectBasePrice(project)

  if (state.subLocations.length > 0) {
    if (locationMatchesSub(project.location || '', state.subLocations)) {
      score += 25
      reasons.push('In your preferred area')
    } else {
      flags.push('Outside preferred area')
    }
  } else {
    score += 25
    reasons.push('In your city')
  }

  if (state.propertyType.length > 0) {
    const typeMatch = state.propertyType.some(sel => projCats.includes(sel.toLowerCase()))
    if (typeMatch) {
      score += 15
      reasons.push('Matches your property type')
    } else {
      flags.push('Different property type')
    }
  } else {
    score += 15
    reasons.push('Matches your property type')
  }

  if (state.bhkType.length > 0) {
    const exactBHK = state.bhkType.some(bhk => projectMatchesBHK(project, bhk))
    if (exactBHK) {
      score += 20
      reasons.push('Matches your configuration')
    } else {
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
        flags.push('Different configuration')
      }
    }
  } else {
    score += 20
    reasons.push('Matches your configuration')
  }

  const hasBudget = state.budgetMin > 0 || state.budgetMax > 0
  if (hasBudget) {
    const uMin = state.budgetMin > 0 ? state.budgetMin : 0
    const uMax = state.isOpenMax ? Infinity : (state.budgetMax > 0 ? state.budgetMax : Infinity)
    if (!basePrice) {
      score += 15
    } else if (basePrice >= uMin && basePrice <= uMax) {
      score += 25
      reasons.push('Matches your budget')
    } else if (basePrice >= uMin * 0.9 && basePrice <= uMax * 1.15) {
      score += 15
      flags.push('Slightly outside budget')
    } else {
      flags.push('Significantly outside budget')
    }
  } else {
    score += 25
    reasons.push('Matches your budget')
  }

  if (state.timeline) {
    if (projectMatchesTimeline(project, state.timeline)) {
      score += 10
      reasons.push('Within your timeline')
    } else {
      flags.push('Possession beyond your timeline')
    }
  } else {
    score += 10
  }

  const trust = project.trustScore || 0
  if (trust >= 80) { score += 5; reasons.push('Highly trusted builder') }
  else if (trust >= 65) score += 3
  else if (trust >= 50) score += 1
  else flags.push('Lower trust score')

  const finalScore = Math.min(100, score + (trust / 1000))
  const tier: MatchResult['tier'] = score >= 90 ? 'exact' : score >= 60 ? 'close' : 'fallback'

  return {
    project,
    score: finalScore,
    matchPct: Math.floor(score),
    tier,
    reasons,
    flags,
  }
}

// ─────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ─────────────────────────────────────────────────────────

const MIN_POOL = 40

export function getMatchingCount(projects: any[], state: MatcherState, currentStep: number): number {
  return buildPool(projects, state, currentStep).length
}

export function countsByPropertyType(projects: any[], state: MatcherState): Record<string, number> {
  const currentProjects = buildPool(projects, state, 3)
  const result: Record<string, number> = { apartment: 0, villa: 0, plot: 0, penthouse: 0 }
  Object.keys(result).forEach(type => {
    result[type] = currentProjects.filter(p => getProjectCategories(p).includes(type)).length
  })
  return result
}

export function countsByBHK(projects: any[], state: MatcherState, bhkOptions: string[]): Record<string, number> {
  const currentProjects = buildPool(projects, state, 4)
  const result: Record<string, number> = {}
  bhkOptions.forEach(bhk => {
    result[bhk] = currentProjects.filter(p => projectMatchesBHK(p, bhk)).length
  })
  return result
}

export function countsByBudget(projects: any[], state: MatcherState, budgetOptions: { label: string; min: number; max: number }[]): Record<string, number> {
  const currentProjects = buildPool(projects, state, 5)
  const result: Record<string, number> = {}
  budgetOptions.forEach(opt => {
    const uMax = opt.max === Infinity ? Infinity : opt.max
    result[opt.label] = currentProjects.filter(p => {
      const price = getProjectBasePrice(p)
      if (!price) return true 
      return price >= opt.min && price <= uMax
    }).length
  })
  return result
}

export function countsByTimeline(projects: any[], state: MatcherState, timelineOptions: { id: string; label: string }[]): Record<string, number> {
  const currentProjects = buildPool(projects, state, 6)
  const result: Record<string, number> = {}
  timelineOptions.forEach(opt => {
    result[opt.id] = currentProjects.filter(p => projectMatchesTimeline(p, opt.id)).length
  })
  return result
}

export function rankProjects(projects: any[], state: MatcherState): MatchResult[] {
  const cityPool = projects.filter(p => (p.city || '').toLowerCase() === state.city.toLowerCase())
  const scored: MatchResult[] = cityPool.map(p => scoreProject(p, state))
  scored.sort((a, b) => b.score - a.score)

  const strictMatches = scored.filter(r => r.score >= 90)
  if (strictMatches.length >= MIN_POOL) return strictMatches.slice(0, MIN_POOL)

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

  const level1 = fallbackPool.filter(r => 
    r.reasons.includes('Matches your budget') && 
    (r.reasons.includes('In your preferred area') || r.reasons.includes('In your city')) &&
    r.reasons.includes('Matches your property type')
  )
  level1.sort((a, b) => b.score - a.score)
  addResults(level1)
  if (finalResults.length >= MIN_POOL) return finalResults.slice(0, MIN_POOL)

  const level2 = fallbackPool.filter(r =>
    r.flags.includes('Slightly outside budget') &&
    r.reasons.includes('Matches your configuration') &&
    (r.reasons.includes('In your preferred area') || r.reasons.includes('In your city'))
  )
  level2.sort((a, b) => b.score - a.score)
  addResults(level2)
  if (finalResults.length >= MIN_POOL) return finalResults.slice(0, MIN_POOL)

  const level3 = fallbackPool.filter(r =>
    r.flags.includes('Outside preferred area') &&
    r.reasons.includes('Matches your configuration') &&
    r.reasons.includes('Matches your budget')
  )
  level3.sort((a, b) => b.score - a.score)
  addResults(level3)
  if (finalResults.length >= MIN_POOL) return finalResults.slice(0, MIN_POOL)

  const level4 = fallbackPool.filter(r => r.flags.includes('Different property type'))
  level4.sort((a, b) => b.score - a.score)
  addResults(level4)
  if (finalResults.length >= MIN_POOL) return finalResults.slice(0, MIN_POOL)

  const remaining = fallbackPool.filter(r => !usedIds.has(r.project.id))
  remaining.sort((a, b) => b.score - a.score)
  addResults(remaining)

  return finalResults.slice(0, MIN_POOL)
}

export { getProjectBHKCategories }
