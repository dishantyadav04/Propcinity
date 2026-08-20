import { describe, expect, it } from 'vitest'
import {
  projectCacheKeys,
  blogCacheKeys,
  locationCacheKeys,
  builderCacheKeys,
} from '@/lib/cache-keys'

describe('projectCacheKeys()', () => {
  it('always invalidates the list, count, and sitemap keys', () => {
    expect(projectCacheKeys()).toEqual(
      expect.arrayContaining(['projects:list:*', 'projects:count', 'projects:sitemap'])
    )
  })

  it('adds a detail key when a slug is provided', () => {
    const keys = projectCacheKeys('my-slug')
    expect(keys).toEqual(
      expect.arrayContaining(['projects:list:*', 'projects:detail:my-slug'])
    )
  })
})

describe('blogCacheKeys()', () => {
  it('returns list, detail, and related keys', () => {
    expect(blogCacheKeys('post-slug')).toEqual(
      expect.arrayContaining(['blogs:list:*', 'blogs:detail:post-slug', 'blogs:related:*'])
    )
  })
})

describe('locationCacheKeys()', () => {
  it('uses a wildcard for localities when no city is given', () => {
    expect(locationCacheKeys()).toEqual(
      expect.arrayContaining(['locations:cities', 'locations:localities:*'])
    )
  })

  it('targets a specific city when one is given', () => {
    expect(locationCacheKeys('city-1')).toEqual(
      expect.arrayContaining(['locations:cities', 'locations:localities:city-1'])
    )
  })
})

describe('builderCacheKeys()', () => {
  it('always invalidates the admin builders list', () => {
    expect(builderCacheKeys()).toEqual(expect.arrayContaining(['builders:list']))
  })

  it('also invalidates a specific builder detail key when an id is given', () => {
    const keys = builderCacheKeys('builder-123')
    expect(keys).toEqual(
      expect.arrayContaining(['builders:list', 'builders:detail:builder-123'])
    )
  })
})