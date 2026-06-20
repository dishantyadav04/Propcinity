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

  const cityMatch = intent.subLocations?.some(
    (loc: string) => project.city.toLowerCase().includes(loc.toLowerCase()) 
      || loc.toLowerCase().includes(project.city.toLowerCase())
  ) ?? false;
  if (cityMatch) {
    reasons.push({ icon: 'MapPin', text: 'Located in your preferred city', strength: 'strong' })
  }

  if (project.constructionStatus === 'ready_to_move') {
    reasons.push({ icon: 'Home', text: 'Ready to move - zero waiting time', strength: 'strong' })
  } else if (project.constructionPercent > 70) {
    reasons.push({ icon: 'Building', text: 'Advanced construction stage', strength: 'strong' })
  }

  if (project.reraStatus === 'registered') {
    reasons.push({ icon: 'BadgeCheck', text: 'RERA registered - legally protected', strength: 'moderate' })
  }

  if (matchedUnit && intent.propertyType.some(t => matchedUnit.type.includes(t))) {
    reasons.push({ icon: 'Home', text: `Matches your property type preference`, strength: 'strong' })
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
