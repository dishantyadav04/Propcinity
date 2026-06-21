// Handles intent hashing and localStorage cache for AI ranking results
// Separate from lib/storage.ts to keep AI-specific logic isolated

export interface AIRankResult {
  ranked: string[]
  reasoning: Record<string, string>
  excluded: string[]
  excludedReason: Record<string, string>
  ts: number
  source: 'ai' | 'cache'
}

const LOCAL_CACHE_KEY = 'propcinity_ai_rank'
const LOCAL_CACHE_TTL = 24 * 60 * 60 * 1000 // 24h in ms

// Stable hash of user intent — changes whenever preferences change
// Sorted arrays ensure same intent always produces same hash regardless of selection order
export function hashIntent(intent: any): string {
  const stable = JSON.stringify({
    city: intent.city,
    subLocations: [...(intent.subLocations || [])].sort(),
    purpose: intent.purpose,
    propertyType: [...(intent.propertyType || [])].sort(),
    bhkType: [...(intent.bhkType || [])].sort(),
    budgetMin: intent.budget?.min,
    budgetMax: intent.budget?.max,
    isOpenMax: intent.budget?.isOpenMax,
    timeline: intent.timeline,
    preferences: [...(intent.preferences || [])].sort(),
    workLocation: intent.workLocation,
  })

  let hash = 0
  for (let i = 0; i < stable.length; i++) {
    hash = ((hash << 5) - hash) + stable.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function getLocalAIRank(): AIRankResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY)
    if (!raw) return null
    const parsed: AIRankResult = JSON.parse(raw)
    if (Date.now() - parsed.ts > LOCAL_CACHE_TTL) {
      localStorage.removeItem(LOCAL_CACHE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function setLocalAIRank(result: Omit<AIRankResult, 'ts' | 'source'>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
      ...result,
      ts: Date.now(),
      source: 'ai',
    }))
  } catch {}
}

export function clearLocalAIRank(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_CACHE_KEY)
}
