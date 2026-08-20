// Generalizes the module-level, in-memory TTL cache pattern that used to
// live only in lib/projects-cache.ts, so the same tiny cache can back any
// client-fetched resource: the public project list (dashboard AND compare,
// sharing one cache instead of compare re-fetching independently), blogs,
// and — with a short TTL — the admin list pages (leads/users/builders/
// projects), which currently have no client cache at all.
//
// Module-level + keyed by name, so calling createResourceCache('projects', …)
// from two different components returns the same underlying store and thus
// the same data, same as the old projects-cache.ts behaved implicitly.

type Entry<T> = { data: T; storedAt: number }

type Slot = { entry: Entry<unknown> | null; ttlMs: number }

const registry = new Map<string, Slot>()

export interface ResourceCache<T> {
  /** Fresh value, or null if missing/expired. */
  get(): T | null
  /** Value plus whether it's past its TTL — lets callers show stale data instantly while refetching. */
  getStale(): { data: T; isStale: boolean } | null
  set(data: T): void
  /** Clears the cached value immediately, regardless of TTL. Call after a mutation. */
  invalidate(): void
}

export function createResourceCache<T>(name: string, ttlMs: number): ResourceCache<T> {
  if (!registry.has(name)) {
    registry.set(name, { entry: null, ttlMs })
  }
  const slot = registry.get(name)!

  return {
    get(): T | null {
      if (!slot.entry) return null
      if (Date.now() - slot.entry.storedAt > slot.ttlMs) return null
      return slot.entry.data as T
    },
    getStale() {
      if (!slot.entry) return null
      const isStale = Date.now() - slot.entry.storedAt > slot.ttlMs
      return { data: slot.entry.data as T, isStale }
    },
    set(data: T) {
      slot.entry = { data, storedAt: Date.now() }
    },
    invalidate() {
      slot.entry = null
    },
  }
}