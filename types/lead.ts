export interface LeadQualification {
  projectId: string
  unitConfigId?: string
  name: string
  phone: string
  email?: string
  timeline: 'within_3_months' | '3_6_months' | '6_12_months' | 'exploring'
  budgetReady: 'yes_full' | 'yes_partial' | 'no_still_planning' | 'loan_approved'
  financeType: 'self_funded' | 'loan_approved' | 'loan_not_applied' | 'unsure'
  decisionMaker: 'myself' | 'family_involved' | 'spouse_only' | 'parents_involved'
  purpose: 'self_use' | 'investment' | 'both'
  preferredDate?: string
  preferredTime?: string
  familyJoining?: boolean
  weekendPreferred?: boolean
  virtualTourFirst?: boolean
  triggerSource?: string
  journeyStage?: 'onboarding' | 'project_interest' | 'consultation_requested'
}

export interface LeadWithScore extends LeadQualification {
  intentScore: number
  intentLabel: 'hot' | 'warm' | 'cold'
}
