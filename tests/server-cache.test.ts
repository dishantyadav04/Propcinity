import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cached, invalidateCache } from '@/lib/server-cache'

type Entry = { value: unknown; storedAt: number }

const state = vi.hoisted(() => {
  const store = new Map<string, Entry>()
  const flags = { enabled: true }
  return {
    store,
    flags,
    getRedis: () => {
      if (!flags.enabled) return null
      return {
        get: async (key: string) => (store.has(key) ? store.get(key) : null),
        set: async (key: string, entry: Entry) => {
          store.set(key, entry)
        },
        keys: async (pattern: string) => {
          if (!pattern.endsWith('*')) return [pattern]
          const prefix = pattern.slice(0, -1)
          return [...store.keys()].filter(k => k.startsWith(prefix))
        },
        del: async (...keys: string[]) => {
          keys.forEach(k => store.delete(k))
        },
      }
    },
  }
})

vi.mock('@/lib/redis', () => ({
  getRedis: state.getRedis,
}))

beforeEach(() => {
  state.store.clear()
  state.flags.enabled = true
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cached()', () => {
  it('returns a fresh cached value without calling the fetcher', async () => {
    state.store.set('cached:1', { value: 'cached-value', storedAt: Date.now() })
    const fetcher = vi.fn(async () => 'fresh-value')
    const result = await cached('cached:1', 60_000, fetcher)
    expect(result).toBe('cached-value')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('calls the fetcher on a miss and stores the result', async () => {
    const fetcher = vi.fn(async () => 42)
    const result = await cached('cached:2', 60_000, fetcher)
    expect(result).toBe(42)
    expect(state.store.get('cached:2')?.value).toBe(42)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('serves a stale value within the SWR window and refreshes in the background', async () => {
    state.store.set('cached:3', { value: 'stale', storedAt: Date.now() - 120_000 })
    const fetcher = vi.fn(async () => 'fresh')
    const result = await cached('cached:3', 60_000, fetcher, { staleWhileRevalidateMs: 120_000 })
    expect(result).toBe('stale')
    await new Promise(r => setTimeout(r, 20))
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(state.store.get('cached:3')?.value).toBe('fresh')
  })

  it('refetches when the value is past the SWR window', async () => {
    state.store.set('cached:4', { value: 'very-stale', storedAt: Date.now() - 5 * 60_000 })
    const result = await cached('cached:4', 60_000, async () => 'fresh', {
      staleWhileRevalidateMs: 60_000,
    })
    expect(result).toBe('fresh')
  })

  it('dedupes concurrent misses into a single fetcher call', async () => {
    const fetcher = vi.fn(async () => {
      await new Promise(r => setTimeout(r, 10))
      return 'value'
    })
    const [a, b] = await Promise.all([
      cached('cached:5', 60_000, fetcher),
      cached('cached:5', 60_000, fetcher),
    ])
    expect(a).toBe('value')
    expect(b).toBe('value')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('never caches a rejected fetcher', async () => {
    await expect(
      cached('cached:6', 60_000, async () => {
        throw new Error('db down')
      })
    ).rejects.toThrow('db down')
    expect(state.store.has('cached:6')).toBe(false)
  })

  it('falls back to the fetcher when Redis is not configured', async () => {
    state.flags.enabled = false
    const fetcher = vi.fn(async () => 'direct')
    const result = await cached('cached:7', 60_000, fetcher)
    expect(result).toBe('direct')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('invalidateCache()', () => {
  it('deletes an exact key', async () => {
    state.store.set('projects:count', { value: 5, storedAt: Date.now() })
    await invalidateCache('projects:count')
    expect(state.store.has('projects:count')).toBe(false)
  })

  it('deletes every key under a trailing-* pattern', async () => {
    state.store.set('projects:list:a', { value: 1, storedAt: Date.now() })
    state.store.set('projects:list:b', { value: 2, storedAt: Date.now() })
    state.store.set('projects:detail:x', { value: 3, storedAt: Date.now() })
    await invalidateCache('projects:list:*')
    expect(state.store.has('projects:list:a')).toBe(false)
    expect(state.store.has('projects:list:b')).toBe(false)
    expect(state.store.has('projects:detail:x')).toBe(true)
  })
})