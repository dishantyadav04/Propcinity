import { Project, UnitConfig } from '@/types/project'
import { UserIntent } from '@/types/user'

export interface FitReason {
  icon: string
  text: string
  strength: 'strong' | 'moderate' | 'weak'
}

export interface FitAnalysis {
  score: number
  headline: string
  reasons: FitReason[]
}

export function generateFitReasons(
  project: Project,
  matchedUnit: UnitConfig | null,
  intent: UserIntent
): FitAnalysis {
  const reasons: FitReason[] = []

  if (matchedUnit) {
    if (matchedUnit.priceMin <= intent.budget.max * 0.9) {
      reasons.push({ icon: 'IndianRupee', text: 'Comfortably within your budget', strength: 'strong' })
    } else if (matchedUnit.priceMin <= intent.budget.max) {
      reasons.push({ icon: 'IndianRupee', text: 'Within your stated budget', strength: 'moderate' })
    } else if (matchedUnit.priceMin <= intent.budget.max * 1.1) {
      reasons.push({ icon: 'IndianRupee', text: 'Slightly above budget but strong value', strength: 'weak' })
    }
  }

  if (project.city.toLowerCase() === intent.location.toLowerCase()) {
    reasons.push({ icon: 'MapPin', text: 'Located in your preferred city', strength: 'strong' })
  }

  if (intent.purpose === 'investment' && project.trustScore >= 80) {
    reasons.push({ icon: 'TrendingUp', text: 'High trust score - lower investment risk', strength: 'strong' })
  }

  if (intent.purpose === 'self-use' && project.riskLabel === 'low') {
    reasons.push({ icon: 'Shield', text: 'Low delivery risk - reliable builder', strength: 'strong' })
  }

  if (project.builderScore >= 80) {
    reasons.push({ icon: 'Star', text: 'Builder has excellent track record', strength: 'strong' })
  }

  if (project.reraId) {
    reasons.push({ icon: 'BadgeCheck', text: 'RERA registered - legally protected', strength: 'moderate' })
  }

  if (matchedUnit && intent.propertyType.includes(matchedUnit.type)) {
    reasons.push({ icon: 'Home', text: `Matches your ${matchedUnit.type} preference`, strength: 'strong' })
  }

  const scoreMap: Record<FitReason['strength'], number> = { strong: 25, moderate: 15, weak: 5 }
  const score = Math.min(100, reasons.reduce((sum, reason) => sum + scoreMap[reason.strength], 0))

  const strongReasons = reasons.filter((reason) => reason.strength === 'strong')
  const rawHeadline = strongReasons.length >= 2
    ? `${strongReasons[0].text.toLowerCase()}, ${strongReasons[1].text.toLowerCase()}.`
    : strongReasons[0]?.text || 'Good match for your requirements.'

  return {
    score,
    headline: rawHeadline.charAt(0).toUpperCase() + rawHeadline.slice(1),
    reasons,
  }
}
