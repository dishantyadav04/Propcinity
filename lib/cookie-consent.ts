export interface CookieConsent {
  essential: true
  analytics: boolean
  functional: boolean
  version: string
  timestamp: number
}

export const COOKIE_CONSENT_KEY = 'propcinity_cookie_consent'
export const CONSENT_VERSION = '1.0'

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsent
    if (parsed.version !== CONSENT_VERSION) return null
    if (!parsed.essential || typeof parsed.analytics !== 'boolean' || typeof parsed.functional !== 'boolean') return null
    return parsed
  } catch {
    return null
  }
}

export function setConsent(prefs: Omit<CookieConsent, 'essential' | 'version' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  try {
    const record: CookieConsent = {
      essential: true,
      analytics: prefs.analytics,
      functional: prefs.functional,
      version: CONSENT_VERSION,
      timestamp: Date.now(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record))
  } catch {
    // localStorage may be unavailable
  }
}
