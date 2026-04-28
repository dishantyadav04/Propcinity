// ── Propcinity Scoring Engine ─────────────────────────
// Calculates builder score and project trust score
// Builder score affects ALL projects linked to that builder

export interface BuilderScoreInput {
  reraRegistered: boolean
  yearsInBusiness: number
  totalProjectsDelivered: number
  onTimeDeliveryPercent: number    // 0-100
  avgDelayMonths: number
  legalCases: number
  customerComplaints: number
  refundDisputes: number
}

export interface BuilderScoreResult {
  total: number                    // 0-100
  breakdown: {
    rera: number                   // max 20
    trackRecord: number            // max 25
    delivery: number               // max 30
    legal: number                  // max 15
    customer: number               // max 10
  }
  label: 'excellent' | 'good' | 'average' | 'poor'
  explanation: string[]
}

export function calculateBuilderScore(input: BuilderScoreInput): BuilderScoreResult {
  const breakdown = {
    rera: 0,
    trackRecord: 0,
    delivery: 0,
    legal: 0,
    customer: 0,
  }
  const explanation: string[] = []

  // 1. RERA compliance (0-20)
  if (input.reraRegistered) {
    breakdown.rera = 20
    explanation.push('RERA registered (+20)')
  } else {
    breakdown.rera = 0
    explanation.push('Not RERA registered (0/20)')
  }

  // 2. Track record (0-25)
  // Years: 0-10 → 0-15pts
  const yearsScore = Math.min(15, input.yearsInBusiness * 1.5)
  // Projects delivered: each project = 1pt, max 10pts
  const projectScore = Math.min(10, input.totalProjectsDelivered)
  breakdown.trackRecord = Math.round(yearsScore + projectScore)
  explanation.push(`Track record: ${input.yearsInBusiness}yrs + ${input.totalProjectsDelivered} projects (${breakdown.trackRecord}/25)`)

  // 3. Delivery performance (0-30)
  // On-time % converts directly: 100% = 30, 90% = 24, 70% = 12, <60% = 0
  const onTimeScore = input.onTimeDeliveryPercent >= 100 ? 30
    : input.onTimeDeliveryPercent >= 90 ? 24
    : input.onTimeDeliveryPercent >= 80 ? 18
    : input.onTimeDeliveryPercent >= 70 ? 12
    : input.onTimeDeliveryPercent >= 60 ? 6
    : 0
  // Penalize avg delay: each month = -2pts (min 0)
  const delayPenalty = Math.min(onTimeScore, input.avgDelayMonths * 2)
  breakdown.delivery = Math.max(0, onTimeScore - Math.round(delayPenalty))
  explanation.push(`Delivery: ${input.onTimeDeliveryPercent}% on-time, ${input.avgDelayMonths}mo avg delay (${breakdown.delivery}/30)`)

  // 4. Legal standing (0-15)
  // 0 cases = 15, each case = -5pts
  breakdown.legal = Math.max(0, 15 - (input.legalCases * 5))
  explanation.push(`Legal: ${input.legalCases} case(s) (${breakdown.legal}/15)`)

  // 5. Customer satisfaction (0-10)
  // 0 complaints = 10, each = -2
  const complaintPenalty = input.customerComplaints * 2 + input.refundDisputes * 3
  breakdown.customer = Math.max(0, 10 - complaintPenalty)
  explanation.push(`Customer: ${input.customerComplaints} complaints, ${input.refundDisputes} disputes (${breakdown.customer}/10)`)

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0)
  const label = total >= 80 ? 'excellent' : total >= 65 ? 'good' : total >= 45 ? 'average' : 'poor'

  return { total: Math.min(100, total), breakdown, label, explanation }
}

export interface ProjectTrustInput {
  builderScore: number             // 0-100, from builder
  reraId: string | null
  reraExpiry: string | null
  constructionPercent: number      // 0-100
  constructionStatus: string
  priceVsAreaAvg: 'below' | 'at' | 'above' | 'unknown'
  amenitiesCount: number
  legalClearances: boolean
  bankApproved: boolean
  rentalYieldPercent?: number
}

export interface ProjectTrustResult {
  trustScore: number               // 0-100
  riskLabel: 'low' | 'medium' | 'high'
  breakdown: {
    builder: number                // max 35 (builder score normalized)
    rera: number                   // max 20
    progress: number               // max 15
    price: number                  // max 15
    legal: number                  // max 15
  }
  explanation: string[]
}

export function calculateProjectTrust(input: ProjectTrustInput): ProjectTrustResult {
  const breakdown = {
    builder: 0,
    rera: 0,
    progress: 0,
    price: 0,
    legal: 0,
  }
  const explanation: string[] = []

  // 1. Builder contribution (0-35) — normalized from builder score
  breakdown.builder = Math.round((input.builderScore / 100) * 35)
  explanation.push(`Builder score ${input.builderScore}/100 → ${breakdown.builder}/35`)

  // 2. RERA (0-20)
  if (input.reraId) {
    const expired = input.reraExpiry && new Date(input.reraExpiry) < new Date()
    breakdown.rera = expired ? 10 : 20
    explanation.push(expired ? 'RERA registered but expired (10/20)' : 'RERA registered & valid (20/20)')
  }

  // 3. Construction progress (0-15)
  breakdown.progress = input.constructionStatus === 'ready_to_move' ? 15
    : Math.round((input.constructionPercent / 100) * 12)
  explanation.push(`Construction ${input.constructionPercent}% (${breakdown.progress}/15)`)

  // 4. Price fairness (0-15)
  breakdown.price = { below: 15, at: 10, above: 5, unknown: 7 }[input.priceVsAreaAvg]
  explanation.push(`Price vs market: ${input.priceVsAreaAvg} (${breakdown.price}/15)`)

  // 5. Legal & financial (0-15)
  breakdown.legal = (input.legalClearances ? 8 : 0) + (input.bankApproved ? 7 : 0)
  explanation.push(`Legal clearances: ${input.legalClearances}, Bank approved: ${input.bankApproved} (${breakdown.legal}/15)`)

  const trustScore = Math.min(100, Object.values(breakdown).reduce((sum, v) => sum + v, 0))
  const riskLabel = trustScore >= 70 ? 'low' : trustScore >= 45 ? 'medium' : 'high'

  return { trustScore, riskLabel, breakdown, explanation }
}

// Recalculate builder score from all project updates
export function recalculateBuilderFromProjects(
  existingInput: BuilderScoreInput,
  projectUpdates: { delayMonths: number; isDelivered: boolean; complaintsCount: number }[]
): BuilderScoreInput {
  const delivered = projectUpdates.filter(p => p.isDelivered)
  const onTime = delivered.filter(p => p.delayMonths === 0).length
  const totalDelivered = delivered.length || existingInput.totalProjectsDelivered

  const avgDelay = delivered.length > 0
    ? delivered.reduce((sum, p) => sum + p.delayMonths, 0) / delivered.length
    : existingInput.avgDelayMonths

  const onTimePercent = totalDelivered > 0
    ? Math.round((onTime / totalDelivered) * 100)
    : existingInput.onTimeDeliveryPercent

  const totalComplaints = projectUpdates.reduce((sum, p) => sum + p.complaintsCount, 0)

  return {
    ...existingInput,
    totalProjectsDelivered: totalDelivered,
    avgDelayMonths: avgDelay,
    onTimeDeliveryPercent: onTimePercent,
    customerComplaints: totalComplaints,
  }
}
