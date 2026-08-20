// Shared Cache-Control header builders. Every route handler should use one
// of these instead of hand-writing header strings, so we never again ship a
// route with no Cache-Control at all (the current default for most of
// app/api/*) or an inconsistent TTL.

export function noStore(): Record<string, string> {
  return { 'Cache-Control': 'no-store, must-revalidate' }
}

export function publicCache(opts: {
  sMaxAge: number
  staleWhileRevalidate?: number
}): Record<string, string> {
  const { sMaxAge } = opts
  if (!sMaxAge || sMaxAge <= 0) {
    throw new Error(
      'publicCache() requires a positive sMaxAge — use noStore() for responses that must never be cached.'
    )
  }
  const swr = opts.staleWhileRevalidate ?? sMaxAge
  return {
    'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
  }
}

export function privateCache(opts: { maxAge: number }): Record<string, string> {
  return { 'Cache-Control': `private, max-age=${opts.maxAge}, must-revalidate` }
}

// Named presets so every route picks from the same small set of TTLs
// instead of inventing new numbers. Bump these here, not per-route.
export const CACHE_PRESETS = {
  // Listings that change when an admin publishes/edits something. Safe to
  // cache at the edge for a couple of minutes since writes call
  // invalidateCache() + revalidatePath() explicitly.
  LISTING: publicCache({ sMaxAge: 120, staleWhileRevalidate: 300 }),
  // Single project/blog detail responses.
  DETAIL: publicCache({ sMaxAge: 300, staleWhileRevalidate: 600 }),
  // Near-static reference data (cities, localities).
  REFERENCE: publicCache({ sMaxAge: 3600, staleWhileRevalidate: 86400 }),
  // Anything behind admin auth, or containing one specific user's data.
  ADMIN: noStore(),
} as const