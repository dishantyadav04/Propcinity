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

function isAllowed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem('propcinity_cookie_consent')
    if (!raw) return false
    const consent = JSON.parse(raw)
    return consent?.analytics === true
  } catch {
    return false
  }
}

export function trackOnboardingCompleted(data: {
  purpose: string
  budget: { min: number; max: number }
  propertyTypes: string[]
  timeline: string
}): void {
  if (isAllowed()) getPostHog()?.capture('onboarding_completed', data)
}

export function trackOnboardingStep(step: number, stepName: string): void {
  if (isAllowed()) getPostHog()?.capture('onboarding_step_reached', { step, stepName })
}

export function trackProjectViewed(data: {
  projectId: string
  projectName: string
  source: string
}): void {
  if (isAllowed()) getPostHog()?.capture('project_viewed', data)
}

export function trackProjectSaved(data: {
  projectId: string
}): void {
  if (isAllowed()) getPostHog()?.capture('project_saved', data)
}

export function trackProjectRejected(data: {
  projectId: string
  reason: string
}): void {
  if (isAllowed()) getPostHog()?.capture('project_rejected', data)
}

export function trackConsultationStarted(data: {
  projectId: string
  triggerSource: string
}): void {
  if (isAllowed()) getPostHog()?.capture('consultation_started', data)
}

export function trackConsultationCompleted(data: {
  projectId: string
}): void {
  if (isAllowed()) getPostHog()?.capture('consultation_completed', data)
}

export function trackAIQuestionAsked(data: {
  projectId: string
  questionType: string
}): void {
  if (isAllowed()) getPostHog()?.capture('ai_question_asked', data)
}

export function trackCompareStarted(data: {
  projectCount: number
}): void {
  if (isAllowed()) getPostHog()?.capture('compare_started', data)
}

export function trackEMICalculated(data: {
  projectId: string
}): void {
  if (isAllowed()) getPostHog()?.capture('emi_calculated', data)
}
