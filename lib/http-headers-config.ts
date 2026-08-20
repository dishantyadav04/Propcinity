// Pure, testable source of truth for the API Cache-Control rules applied in
// next.config.ts. Kept out of next.config.ts itself so it can be unit
// tested without booting Next's config loader.
//
// IMPORTANT: this intentionally does NOT include a blanket `/api/(.*)` rule
// anymore. Next.js appends config-level headers alongside route-handler
// headers rather than letting one replace the other, so a blanket no-store
// rule here silently defeated the Cache-Control that route handlers try to
// set (see vercel/next.js#75270). Only routes that must never be cached —
// admin, leads, contact, onboarding, ai — get a rule here. Every public read
// route sets its own Cache-Control via lib/cache-control.ts.

export type HeaderRule = {
  source: string
  headers: { key: string; value: string }[]
}

const NO_STORE_SOURCES = [
  '/api/admin/(.*)',
  '/api/leads/(.*)',
  '/api/contact/(.*)',
  '/api/onboarding/(.*)',
  '/api/ai/(.*)',
]

export function buildApiHeaderRules(): HeaderRule[] {
  return NO_STORE_SOURCES.map(source => ({
    source,
    headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
  }))
}