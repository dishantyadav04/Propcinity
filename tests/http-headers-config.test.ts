import { describe, expect, it } from 'vitest'
import { buildApiHeaderRules } from '@/lib/http-headers-config'

describe('buildApiHeaderRules()', () => {
  it('creates a no-store rule for every protected source', () => {
    const rules = buildApiHeaderRules()
    expect(rules.map(r => r.source)).toEqual([
      '/api/admin/(.*)',
      '/api/leads/(.*)',
      '/api/contact/(.*)',
      '/api/onboarding/(.*)',
      '/api/ai/(.*)',
    ])
  })

  it('each rule sets exactly one no-store Cache-Control header', () => {
    const rules = buildApiHeaderRules()
    for (const rule of rules) {
      expect(rule.headers).toEqual([{ key: 'Cache-Control', value: 'no-store, must-revalidate' }])
    }
  })

  it('does not include a blanket /api/(.*) rule', () => {
    const sources = buildApiHeaderRules().map(r => r.source)
    expect(sources).not.toContain('/api/(.*)')
  })
})