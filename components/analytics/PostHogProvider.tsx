'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'
import { getConsent } from '@/lib/cookie-consent'

function PostHogInit() {
  const { consent } = useCookieConsent()
  // Track whether the initial $pageview has been fired to avoid double-fire.
  const initialPageviewFired = useRef(false)

  // ─── Step 1: Initialize PostHog once on mount ──────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    if (posthog.__loaded) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://us.posthog.com',
      defaults: '2026-01-30',
      capture_pageview: false,    // Managed manually by PostHogPageView
      capture_pageleave: true,
      disable_session_recording: false,
      persistence: 'localStorage+cookie',
      opt_out_capturing_by_default: true,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: false,
        },
      },
      on_xhr_error: () => {},

      // `loaded` is the ONLY safe place to call opt_in_capturing() on
      // first paint — it fires after the SDK queue is established.
      // We read consent directly from localStorage here because React
      // state (consent) closes over its value at the time posthog.init()
      // runs, which is before CookieConsentProvider's useEffect has set it.
      loaded: (ph) => {
        const storedConsent = getConsent()
        if (storedConsent?.analytics) {
          ph.opt_in_capturing()
          if (!initialPageviewFired.current) {
            initialPageviewFired.current = true
            ph.capture('$pageview', { $current_url: window.location.href })
          }
        }
      },
    })
  }, []) // intentionally no deps — runs exactly once

  // ─── Step 2: React to consent changes (banner accept/reject) ──────────────
  useEffect(() => {
    // `consent` starts as null (CookieConsentProvider's useState initial value).
    // We ignore that null until a real decision is made.
    if (consent === null) return

    if (consent.analytics) {
      posthog.opt_in_capturing()
      // Fire the initial pageview if not yet fired (e.g. user just accepted
      // the banner for the first time on this visit, or PostHog wasn't
      // loaded yet during the `loaded` callback path above).
      if (!initialPageviewFired.current) {
        initialPageviewFired.current = true
        // Use a small timeout to ensure opt_in_capturing has taken effect.
        setTimeout(() => {
          posthog.capture('$pageview', { $current_url: window.location.href })
        }, 0)
      }
    } else {
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
