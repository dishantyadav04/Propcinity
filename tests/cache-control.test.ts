import { describe, expect, it } from 'vitest'
import { noStore, publicCache, privateCache, CACHE_PRESETS } from '@/lib/cache-control'

describe('noStore()', () => {
  it('returns no-store, must-revalidate', () => {
    expect(noStore()).toEqual({ 'Cache-Control': 'no-store, must-revalidate' })
  })
})

describe('publicCache()', () => {
  it('builds a public header with s-maxage and stale-while-revalidate', () => {
    expect(publicCache({ sMaxAge: 120, staleWhileRevalidate: 300 })).toEqual({
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
    })
  })

  it('defaults stale-while-revalidate to sMaxAge', () => {
    expect(publicCache({ sMaxAge: 60 })).toEqual({
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
    })
  })

  it('throws when sMaxAge is missing or zero', () => {
    expect(() => publicCache({ sMaxAge: 0 })).toThrow()
  })

  it('throws on a negative sMaxAge', () => {
    expect(() => publicCache({ sMaxAge: -1 })).toThrow()
  })
})

describe('privateCache()', () => {
  it('builds a private header with max-age and must-revalidate', () => {
    expect(privateCache({ maxAge: 300 })).toEqual({
      'Cache-Control': 'private, max-age=300, must-revalidate',
    })
  })
})

describe('CACHE_PRESETS', () => {
  it('LISTING uses the 120s listing TTL', () => {
    expect(CACHE_PRESETS.LISTING).toEqual(publicCache({ sMaxAge: 120, staleWhileRevalidate: 300 }))
  })

  it('ADMIN is never cached', () => {
    expect(CACHE_PRESETS.ADMIN).toEqual(noStore())
  })
})