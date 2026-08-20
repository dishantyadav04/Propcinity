// Central "what does mutating X touch" map. Every admin create/update/
// delete/publish route should call invalidateCache() (lib/server-cache.ts)
// against the keys returned here — that's the whole invalidation contract
// in one reviewable place, instead of scattered ad-hoc cache.del() calls
// that are easy to forget when a new field or route is added.

export function projectCacheKeys(slug?: string): string[] {
  const keys = ['projects:list:*', 'projects:count', 'projects:sitemap']
  if (slug) keys.push(`projects:detail:${slug}`)
  return keys
}

export function blogCacheKeys(slug: string): string[] {
  return ['blogs:list:*', `blogs:detail:${slug}`, 'blogs:related:*']
}

export function locationCacheKeys(cityId?: string): string[] {
  const keys = ['locations:cities']
  keys.push(cityId ? `locations:localities:${cityId}` : 'locations:localities:*')
  return keys
}

export function builderCacheKeys(id?: string): string[] {
  const keys = ['builders:list']
  if (id) keys.push(`builders:detail:${id}`)
  return keys
}