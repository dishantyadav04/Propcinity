// Generic Redis-backed cache-aside helper for expensive/public server reads
// (Supabase queries, mostly). Generalizes the pattern already used in
// app/api/nearby/route.ts so every route doesn't hand-roll it slightly
// differently.
//
// Behavior:
//  - cache hit inside ttlMs      -> return immediately, no fetcher call
//  - hit but past ttlMs,
//    within staleWhileRevalidateMs -> return the stale value immediately,
//                                      revalidate in the background
//  - miss (or past the SWR window) -> call fetcher, store, return
//  - concurrent misses for the same key are de-duped into one fetcher call
//  - a rejected fetcher is never cached (so a transient DB error isn't
//    "remembered" for the full TTL)
//  - if Redis isn't configured, falls back to calling the fetcher directly

import { getRedis } from './redis'

type CacheEntry<T> = { value: T; storedAt: number }

type CacheOptions = {
  /** How long past ttlMs a stale value may still be served while a background refresh runs. */
  staleWhileRevalidateMs?: number
}

// Module-level so concurrent requests within the same server instance share
// in-flight fetches, regardless of which route triggered them.
const inFlight = new Map<string, Promise<unknown>>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const redis = getRedis()
  if (!redis) {
    return fetcher()
  }

  let entry: CacheEntry<T> | null = null
  try {
    entry = (await redis.get(key)) as CacheEntry<T> | null
  } catch {
    entry = null
  }

  const now = Date.now()

  if (entry) {
    const age = now - entry.storedAt
    if (age <= ttlMs) {
      return entry.value
    }

    const swrMs = options.staleWhileRevalidateMs ?? 0
    if (swrMs > 0 && age <= ttlMs + swrMs) {
      // Serve stale immediately; refresh in the background without
      // blocking (or failing) the current request.
      void dedupedFetch(key, fetcher).catch(() => {})
      return entry.value
    }
  }

  return dedupedFetch(key, fetcher)
}

async function dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = (async () => {
    try {
      const value = await fetcher()
      await store(key, value)
      return value
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, promise)
  return promise
}

async function store<T>(key: string, value: T): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.set(key, { value, storedAt: Date.now() } satisfies CacheEntry<T>)
  } catch {
    // Cache writes are best-effort — never fail the request over this.
  }
}

/**
 * Bust one exact key, or every key under a prefix when given a trailing `*`
 * (e.g. `projects:list:*`). Call this from every admin mutation route that
 * touches cached data — see lib/cache-keys.ts for the canonical key list
 * per resource.
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    if (keyOrPattern.endsWith('*')) {
      const keys = await redis.keys(keyOrPattern)
      if (keys.length) await redis.del(...keys)
    } else {
      await redis.del(keyOrPattern)
    }
  } catch {
    // best-effort
  }
}