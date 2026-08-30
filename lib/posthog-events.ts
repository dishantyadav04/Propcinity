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

export function trackConsultationStarted(data: {
  projectId: string
  triggerSource: string
}): void {
  track('consultation_started', data)
}

export function trackAIQuestionAsked(data: {
  projectId: string
  questionType: string
}): void {
  track('ai_question_asked', data)
}

export function trackEMICalculated(data: {
  projectId: string
}): void {
  track('emi_calculated', data)
}
