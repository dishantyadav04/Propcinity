'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'

function PostHogInit() {
  const { consent } = useCookieConsent()

  // ✅ Initialize PostHog once on mount.
  // The `loaded` callback fires only after the SDK is fully bootstrapped,
  // ensuring opt_in_capturing() runs at the right time — not in the same
  // synchronous tick as init() (which caused the race condition).
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key || !host) return

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: false,    // Handled manually by PostHogPageView
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
        opt_out_capturing_by_default: true,
        loaded: (ph) => {
          // At this point the SDK is guaranteed to be ready.
          // Apply the initial consent state.
          if (consent?.analytics) {
            ph.opt_in_capturing()
          }
        },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally omits `consent` — only runs once at mount.

  // ✅ React to consent changes after init (e.g. user accepts/rejects banner).
  // Guards with __loaded so this is a no-op if PostHog isn't ready yet
  // (the `loaded` callback above will handle the initial opt-in instead).
  useEffect(() => {
    if (!posthog.__loaded) return

    if (consent?.analytics) {
      posthog.opt_in_capturing()
    } else if (consent !== null) {
      posthog.opt_out_capturing()
    }
  }, [consent])

  return null
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogInit />
      {children}
    </PHProvider>
  )
}
