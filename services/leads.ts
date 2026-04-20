import { LeadQualification, LeadWithScore } from '@/types/lead'

export function calculateIntentScore(lead: LeadQualification): LeadWithScore {
  let score = 0

  const timelineScore: Record<LeadQualification['timeline'], number> = {
    within_3_months: 30,
    '3_6_months': 20,
    '6_12_months': 10,
    exploring: 0,
  }
  score += timelineScore[lead.timeline] || 0

  const budgetScore: Record<LeadQualification['budgetReady'], number> = {
    yes_full: 25,
    loan_approved: 25,
    yes_partial: 15,
    no_still_planning: 0,
  }
  score += budgetScore[lead.budgetReady] || 0

  const financeScore: Record<LeadQualification['financeType'], number> = {
    self_funded: 20,
    loan_approved: 20,
    loan_not_applied: 10,
    unsure: 0,
  }
  score += financeScore[lead.financeType] || 0

  const decisionScore: Record<LeadQualification['decisionMaker'], number> = {
    myself: 15,
    spouse_only: 12,
    family_involved: 8,
    parents_involved: 5,
  }
  score += decisionScore[lead.decisionMaker] || 0

  if (lead.virtualTourFirst === false) score += 5
  if (lead.familyJoining === true) score += 5

  const intentLabel: 'hot' | 'warm' | 'cold' =
    score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold'

  return { ...lead, intentScore: score, intentLabel }
}
