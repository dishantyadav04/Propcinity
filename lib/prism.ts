// ── PRISM: Property Risk Intelligence & Smart Matching ────
// Multi-dimensional buyer-project matching engine

import { Project } from '@/types/project'

export interface BuyerProfile {
  city: string
  subLocations: string[]
  purpose: 'self-use' | 'investment' | 'both' | string
  propertyType: string[]
  bhkType: string[]
  budget: { min: number; max: number; isOpenMax?: boolean }
  timeline: string
  preferences: string[]
  // Behavioural signals (optional — from localStorage history)
  rejectedIds?: string[]
  viewHistory?: { id: string; durationSeconds: number }[]
}

export interface PRISMResult {
  project: Project
  totalScore: number          // 0-100 final score
  tier: 'precision' | 'value' | 'stretch'
  breakdown: {
    location: number          // 0-30
    budget: number            // 0-25
    configuration: number     // 0-20
    trustAlignment: number    // 0-15
    purposeResonance: number  // 0-10
  }
  reasons: string[]           // human-readable match reasons
  flags: string[]             // yellow/red flags
}

// ── Location scoring ───────────────────────────────────────
function scoreLocation(project: Project, buyer: BuyerProfile): number {
  const pLoc = (project.location || '').toLowerCase()

  // Exact sub-location match — full 30 pts
  const exactMatch = buyer.subLocations.some(sl => {
    const slLow = sl.toLowerCase()
    return pLoc === slLow || pLoc.includes(slLow) || slLow.includes(pLoc)
  })
  if (exactMatch) return 30

  // City-only match — 10 pts (no sub-location selected OR no sub-location matches)
  if ((project.city || '').toLowerCase() === buyer.city.toLowerCase()) return 10

  return 0
}

// ── Budget scoring ─────────────────────────────────────────
function scoreBudget(project: Project, buyer: BuyerProfile): number {
  const prices = (project.unitConfigs || []).map(u => u.priceMin).filter(Boolean)
  if (prices.length === 0) return 12 // unknown price — partial credit

  const projectMin = Math.min(...prices)
  const projectMax = Math.max(
    ...(project.unitConfigs || []).map(u => u.priceMax || u.priceMin).filter(Boolean)
  )

  const userMin = buyer.budget.min || 0
  const userMax = buyer.budget.isOpenMax ? Infinity : (buyer.budget.max || Infinity)

  // Perfect overlap
  if (projectMin >= userMin && projectMax <= userMax) return 25

  // Partial overlap — project range partially inside user budget
  const overlapMin = Math.max(projectMin, userMin)
  const overlapMax = Math.min(projectMax, userMax === Infinity ? projectMax : userMax)
  if (overlapMin <= overlapMax) {
    const projectRange = Math.max(1, projectMax - projectMin)
    const overlapRatio = (overlapMax - overlapMin) / projectRange
    return Math.round(overlapRatio * 20) // max 20 for partial
  }

  // Within 20% of budget boundary
  if (projectMin <= userMax * 1.2 && projectMax >= userMin * 0.8) return 8

  return 0
}

// ── Configuration scoring ──────────────────────────────────
function scoreConfiguration(project: Project, buyer: BuyerProfile): number {
  if (buyer.bhkType.length === 0 && buyer.propertyType.length === 0) return 10

  const configs = (project.unitConfigs || []).map(u => (u.type || '').toLowerCase())
  let score = 0

  // BHK match (0-12)
  if (buyer.bhkType.length > 0) {
    const hasBHK = buyer.bhkType.some(b => {
      const bLow = b.toLowerCase()
      const num = bLow.replace('bhk', '').trim()
      return configs.some(c => c.includes(bLow) || (num && c.startsWith(num)))
    })
    if (hasBHK) score += 12
  } else {
    score += 6 // no BHK specified — partial credit
  }

  // Property type match (0-8)
  if (buyer.propertyType.length > 0) {
    const typeMatch = buyer.propertyType.some(sel => {
      const s = sel.toLowerCase()
      if (s === 'apartment') return configs.some(c =>
        c.includes('bhk') || c.includes('studio') || c.includes('rk') || c.includes('duplex')
      )
      if (s === 'villa') return configs.some(c =>
        c.includes('villa') || c.includes('row house')
      )
      if (s === 'plot') return configs.some(c => c.includes('plot'))
      if (s === 'penthouse') return configs.some(c =>
        c.includes('penthouse') || c.includes('4.5') || c.includes('5bhk')
      )
      return false
    })
    if (typeMatch) score += 8
  } else {
    score += 4
  }

  return Math.min(20, score)
}

// ── Trust alignment scoring ────────────────────────────────
function scoreTrustAlignment(project: Project, buyer: BuyerProfile): { score: number; flags: string[] } {
  const flags: string[] = []
  let score = 0

  const trust = project.trustScore || 50
  const risk = project.riskLabel || 'medium'

  // Purpose-based trust requirements
  if (buyer.purpose === 'investment') {
    // Investors need HIGH trust — risky projects are bad investments
    if (trust >= 80) score += 15
    else if (trust >= 65) score += 10
    else if (trust >= 50) score += 5
    if (risk === 'high') flags.push('High risk — not ideal for investment')
  } else if (buyer.purpose === 'self-use') {
    // Self-use buyers care about safety too but slightly more forgiving
    if (trust >= 70) score += 15
    else if (trust >= 55) score += 10
    else score += 5
    if (risk === 'high') flags.push('High risk project — verify legal status')
  } else {
    // Both — balanced
    if (trust >= 75) score += 15
    else if (trust >= 60) score += 10
    else score += 5
  }

  // Signal interdependence — high trust + good progress = bonus
  const progress = project.constructionPercent || 0
  if (trust >= 75 && progress >= 60) score = Math.min(15, score + 2)

  return { score, flags }
}

// ── Purpose resonance scoring ──────────────────────────────
function scorePurposeResonance(project: Project, buyer: BuyerProfile): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let score = 0

  if (buyer.purpose === 'investment' || buyer.purpose === 'both') {
    // Investment signals: IT proximity, metro, good rental yield potential
    const amenities = (project.amenities || []).map(a => a.toLowerCase())
    const hasITProximity = amenities.some(a => a.includes('it') || a.includes('tech'))
    const hasMetro = amenities.some(a => a.includes('metro'))
    if (hasITProximity) { score += 4; reasons.push('Near IT hub — good rental demand') }
    if (hasMetro) { score += 3; reasons.push('Metro connectivity — strong appreciation') }
    if (project.trustScore >= 80) { score += 3; reasons.push('High trust — safe investment') }
  }

  if (buyer.purpose === 'self-use' || buyer.purpose === 'both') {
    // Self-use signals: amenities, school proximity, gated community
    const amenityCount = (project.amenities || []).length
    if (amenityCount >= 10) { score += 4; reasons.push('Amenity-rich for family living') }
    else if (amenityCount >= 6) { score += 2; reasons.push('Good amenity coverage') }
    const amenities = (project.amenities || []).map(a => a.toLowerCase())
    if (amenities.some(a => a.includes('school') || a.includes('play'))) {
      score += 3; reasons.push('School & play areas nearby')
    }
    if (amenities.some(a => a.includes('gated') || a.includes('security'))) {
      score += 3; reasons.push('Gated community — family-safe')
    }
  }

  return { score: Math.min(10, score), reasons }
}

// ── Preference bonus (soft, max 5 pts) ────────────────────
function scorePreferences(project: Project, buyer: BuyerProfile): number {
  if (buyer.preferences.length === 0) return 0
  const amenities = (project.amenities || []).map(a => a.toLowerCase())
  let matches = 0
  buyer.preferences.forEach(pref => {
    const prefLow = pref.toLowerCase()
    if (amenities.some(a => a.includes(prefLow) || prefLow.includes(a))) matches++
  })
  // Soft scoring: each matched preference = 0.5 pts, max 5
  return Math.min(5, matches * 0.5)
}

// ── Timeline filter (soft — never hard-blocks) ─────────────
function timelineCompatible(project: Project, buyer: BuyerProfile): boolean {
  if (!buyer.timeline || !project.possessionDate) return true
  const now = new Date()
  const months = Math.round(
    (new Date(project.possessionDate).getTime() - now.getTime()) /
    (1000 * 60 * 60 * 24 * 30)
  )
  if (buyer.timeline === 'under_1_year') return months <= 14 // slight buffer
  if (buyer.timeline === '1_to_2_years') return months <= 28
  if (buyer.timeline === '3_to_5_years') return months <= 66
  return true // 5_plus matches everything
}

// ── Main PRISM function ────────────────────────────────────
export function prismMatch(projects: Project[], buyer: BuyerProfile): PRISMResult[] {
  const results: PRISMResult[] = []
  const rejected = new Set(buyer.rejectedIds || [])

  for (const project of projects) {
    if (rejected.has(project.id)) continue

    const flags: string[] = []
    const reasons: string[] = []

    const locationScore = scoreLocation(project, buyer)
    const budgetScore = scoreBudget(project, buyer)
    const configScore = scoreConfiguration(project, buyer)
    const { score: trustScore, flags: trustFlags } = scoreTrustAlignment(project, buyer)
    const { score: purposeScore, reasons: purposeReasons } = scorePurposeResonance(project, buyer)
    const prefBonus = scorePreferences(project, buyer)

    flags.push(...trustFlags)
    reasons.push(...purposeReasons)

    if (locationScore === 30) reasons.push('In your preferred area')
    else if (locationScore === 10) reasons.push('In your city')

    if (budgetScore >= 20) reasons.push('Within your budget')
    else if (budgetScore >= 8) reasons.push('Near your budget range')

    if (configScore >= 15) reasons.push('Matches your BHK preference')

    const rawTotal = locationScore + budgetScore + configScore + trustScore + purposeScore + prefBonus
    // Normalize to 0-100 (max possible = 30+25+20+15+10+5 = 105)
    const totalScore = Math.min(100, Math.round((rawTotal / 105) * 100))

    const timelineOk = timelineCompatible(project, buyer)
    if (!timelineOk) {
      flags.push('Possession may exceed your timeline')
    }

    // Tier assignment
    // Precision: high location + budget + config match
    // Value: good value despite some mismatches
    // Stretch: outside criteria but strong trust/purpose fit
    const tier: PRISMResult['tier'] =
      locationScore >= 20 && budgetScore >= 15 && configScore >= 12
        ? 'precision'
        : totalScore >= 40
          ? 'value'
          : 'stretch'

    results.push({
      project,
      totalScore,
      tier,
      breakdown: {
        location: locationScore,
        budget: budgetScore,
        configuration: configScore,
        trustAlignment: trustScore,
        purposeResonance: purposeScore,
      },
      reasons,
      flags,
    })
  }

  // Sort: precision first (by score), then value, then stretch
  return results.sort((a, b) => {
    const tierOrder = { precision: 0, value: 1, stretch: 2 }
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[a.tier] - tierOrder[b.tier]
    }
    return b.totalScore - a.totalScore
  })
}
