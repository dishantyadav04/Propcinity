'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'
import { getConsent } from '@/lib/cookie-consent'

// Module-level flag — survives React Strict Mode double-mounts.
// Ensures $pageview fires exactly once per browser session load.
let initialPageviewFired = false
// Module-level flag — set synchronously the instant init() is *called*,
// not when it *finishes*. This is what actually survives Strict Mode's
// synchronous mount -> unmount -> remount, since posthog.__loaded only
// flips true after the async loaded() callback resolves.
let initStarted = false

function PostHogInit() {
  const { consent } = useCookieConsent()

  // ─── Step 1: Initialize PostHog once on mount ──────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    if (initStarted || posthog.__loaded) return
    initStarted = true

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://ingest.propcinity.in',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? 'https://us.posthog.com',

      capture_pageview: false,   // Managed manually by PostHogPageView
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      // Do NOT set opt_out_capturing_by_default — we manage tiers via set_config instead.
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: { password: true, email: false },
      },
      on_xhr_error: () => {},

      loaded: (ph) => {
        const storedConsent = getConsent()

        if (storedConsent?.analytics) {
          ph.set_config({
            disable_session_recording: false,
            person_profiles: 'identified_only',
          })
        } else {
          ph.set_config({
            disable_session_recording: true,
            person_profiles: 'never',
          })
        }
      },
    })

    // Fire the initial $pageview right after init() is called, not inside
    // the async loaded() callback. capture() internally queues events until
    // the SDK is ready to send, so this is safe even before `loaded` fires,
    // and it can no longer be dropped by a racing second init() call.
    if (!initialPageviewFired) {
      initialPageviewFired = true
      posthog.capture('$pageview', { $current_url: window.location.href })
    }
  }, []) // intentionally no deps — runs exactly once

  // ─── Step 2: React to consent changes (banner accept / reject) ─────────────
  useEffect(() => {
    // consent is null until CookieConsentProvider resolves — ignore that.
    if (consent === null) return
    if (!posthog.__loaded) return

    if (consent.analytics) {
      // Upgrade to full tracking
      posthog.opt_in_capturing()
      posthog.set_config({
        disable_session_recording: false,
        person_profiles: 'identified_only',
      })
    } else {
      // Downgrade to anonymous-only — keep capturing but strip identifying features
      posthog.opt_in_capturing()
      posthog.set_config({
        disable_session_recording: true,
        person_profiles: 'never',
      })
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
