// Client-safe PostHog event tracking functions
// All functions are fire-and-forget — never await these
// Uses the posthog-js singleton directly (same instance as PostHogProvider)
// PostHog's internal opt-in/opt-out state handles consent — no manual gate needed.

import posthog from 'posthog-js'

function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return
  posthog.capture(event, properties)
}

export function trackOnboardingCompleted(data: {
  purpose: string
  budget: { min: number; max: number }
  propertyTypes: string[]
  timeline: string
}): void {
  track('onboarding_completed', data)
}

export function trackOnboardingStep(step: number, stepName: string): void {
  track('onboarding_step_reached', { step, stepName })
}

export function trackProjectViewed(data: {
  projectId: string
  projectName: string
  source: string
}): void {
  track('project_viewed', data)
}

export function trackProjectSaved(data: {
  projectId: string
}): void {
  track('project_saved', data)
}

export function trackProjectRejected(data: {
  projectId: string
  reason: string
}): void {
  track('project_rejected', data)
}

export function trackConsultationStarted(data: {
  projectId: string
  triggerSource: string
}): void {
  track('consultation_started', data)
}

export function trackConsultationCompleted(data: {
  projectId: string
}): void {
  track('consultation_completed', data)
}

export function trackAIQuestionAsked(data: {
  projectId: string
  questionType: string
}): void {
  track('ai_question_asked', data)
}

export function trackCompareStarted(data: {
  projectCount: number
}): void {
  track('compare_started', data)
}

export function trackEMICalculated(data: {
  projectId: string
}): void {
  track('emi_calculated', data)
}
