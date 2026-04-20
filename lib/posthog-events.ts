// Client-safe PostHog event tracking functions
// All functions are fire-and-forget — never await these
// Called from both client components and server-side API routes

let posthogClient: typeof import('posthog-js').default | null = null

function getPostHog() {
  if (typeof window === 'undefined') return null
  if (!posthogClient) {
    // Lazy import — only loads posthog-js in browser
    import('posthog-js').then((mod) => {
      posthogClient = mod.default
    })
    return null
  }
  return posthogClient
}

export function trackOnboardingCompleted(data: {
  purpose: string
  budget: { min: number; max: number }
  propertyTypes: string[]
  timeline: string
}): void {
  getPostHog()?.capture('onboarding_completed', data)
}

export function trackOnboardingStep(step: number, stepName: string): void {
  getPostHog()?.capture('onboarding_step_reached', { step, stepName })
}

export function trackProjectViewed(data: {
  projectId: string
  projectName: string
  trustScore: number
  source: string
}): void {
  getPostHog()?.capture('project_viewed', data)
}

export function trackProjectSaved(data: {
  projectId: string
  trustScore: number
}): void {
  getPostHog()?.capture('project_saved', data)
}

export function trackProjectRejected(data: {
  projectId: string
  reason: string
}): void {
  getPostHog()?.capture('project_rejected', data)
}

export function trackConsultationStarted(data: {
  projectId: string
  triggerSource: string
}): void {
  getPostHog()?.capture('consultation_started', data)
}

export function trackConsultationCompleted(data: {
  projectId: string
}): void {
  // intentLabel deliberately excluded — never expose to client
  getPostHog()?.capture('consultation_completed', data)
}

export function trackAIQuestionAsked(data: {
  projectId: string
  questionType: string
}): void {
  getPostHog()?.capture('ai_question_asked', data)
}

export function trackCompareStarted(data: {
  projectCount: number
}): void {
  getPostHog()?.capture('compare_started', data)
}

export function trackEMICalculated(data: {
  projectId: string
}): void {
  getPostHog()?.capture('emi_calculated', data)
}

export function trackWhatsAppOpened(data: {
  projectId: string
  source: string
}): void {
  getPostHog()?.capture('whatsapp_opened', data)
}
