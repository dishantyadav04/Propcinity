import { describe, expect, it } from 'vitest'
import { createResourceCache } from '@/lib/client-cache'

describe('createResourceCache()', () => {
  it('returns null before anything is set', () => {
    const cache = createResourceCache<number>('client:empty', 1000)
    expect(cache.get()).toBeNull()
  })

  it('returns the value after set', () => {
    const cache = createResourceCache<number>('client:set', 1000)
    cache.set(42)
    expect(cache.get()).toBe(42)
  })

  it('returns null once past the TTL', async () => {
    const cache = createResourceCache<number>('client:ttl', 20)
    cache.set(42)
    await new Promise(r => setTimeout(r, 60))
    expect(cache.get()).toBeNull()
  })

  it('getStale reports freshness and staleness', async () => {
    const cache = createResourceCache<number>('client:stale', 20)
    cache.set(42)
    expect(cache.getStale()).toEqual({ data: 42, isStale: false })
    await new Promise(r => setTimeout(r, 60))
    expect(cache.getStale()).toEqual({ data: 42, isStale: true })
  })

  it('invalidate clears the value immediately', () => {
    const cache = createResourceCache<number>('client:invalidate', 1000)
    cache.set(42)
    cache.invalidate()
    expect(cache.get()).toBeNull()
  })

  it('same-name caches share the underlying store', () => {
    const a = createResourceCache<number>('client:shared', 1000)
    const b = createResourceCache<number>('client:shared', 1000)
    a.set(7)
    expect(b.get()).toBe(7)
  })
})