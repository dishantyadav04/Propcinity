'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'
import { getConsent } from '@/lib/cookie-consent'

// Module-level flag — survives React Strict Mode double-mounts.
// Ensures $pageview fires exactly once per browser session load.
let initialPageviewFired = false

function PostHogInit() {
  const { consent } = useCookieConsent()

  // ─── Step 1: Initialize PostHog once on mount ──────────────────────────────
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return
    if (posthog.__loaded) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://us.posthog.com',
      defaults: '2026-01-30',
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
          // Full tracking — user has already accepted analytics consent
          ph.set_config({
            disable_session_recording: false,
            person_profiles: 'identified_only',
          })
        } else {
          // Anonymous tracking — no consent or declined.
          // $pageview fires but no PII, no fingerprinting, no session recording.
          ph.set_config({
            disable_session_recording: true,
            person_profiles: 'never',
          })
        }

        // Always fire the initial $pageview — anonymous URL data needs no consent.
        if (!initialPageviewFired) {
          initialPageviewFired = true
          ph.capture('$pageview', { $current_url: window.location.href })
        }
      },
    })
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
