// Safe localStorage wrapper — never throws on SSR

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) return fallback
      return JSON.parse(item) as T
    } catch {
      return fallback
    }
  },

  set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
    } catch {}
  },
}

// Keys used across the app — single source of truth
export const STORAGE_KEYS = {
  USER_INTENT:       'userIntent',
  CURATED_IDS:       'curatedIds',
  REJECTED_IDS:      'rejectedProjectIds',
  SAVED_IDS:         'savedIds',
  COMPARE_ITEMS:     'compareItems',
  ONBOARDING_DONE:   'onboarding_complete',
  AI_RANK_HASH:      'propcinity_ai_rank_hash',
  RECO_CACHE:        'propcinity_reco_cache',
  CHAT_HISTORY:      'propcinity_ai_chat_history',
} as const
