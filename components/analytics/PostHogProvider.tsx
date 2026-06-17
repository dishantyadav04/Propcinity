'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'
import { getConsent } from '@/lib/cookie-consent'

function PostHogInit() {
  const { consent } = useCookieConsent()
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
      capture_pageview: false,   // Managed manually by PostHogPageView
      capture_pageleave: true,
      persistence: 'localStorage+cookie',

      // Start opted OUT of everything by default.
      // We immediately opt in below but with session recording disabled
      // until the user grants analytics consent.
      opt_out_capturing_by_default: true,

      session_recording: {
        maskAllInputs: true,
        maskInputOptions: { password: true, email: false },
      },
      on_xhr_error: () => {},

      loaded: (ph) => {
        const storedConsent = getConsent()

        if (storedConsent?.analytics) {
          // Full tracking — user has already accepted analytics
          ph.opt_in_capturing()
          ph.set_config({ disable_session_recording: false })
        } else {
          // Anonymous tracking — no consent yet (or declined)
          // $pageview with just a URL is equivalent to a server access log.
          // No PII, no fingerprinting, no session recording, no person profile.
          ph.opt_in_capturing()
          ph.set_config({
            disable_session_recording: true,
            person_profiles: 'never',
          })
        }

        // Always fire the initial $pageview — anonymous URL data needs no consent.
        if (!initialPageviewFired.current) {
          initialPageviewFired.current = true
          ph.capture('$pageview', { $current_url: window.location.href })
        }
      },
    })
  }, []) // intentionally no deps — runs exactly once

  // ─── Step 2: React to consent changes (banner accept / reject) ─────────────
  useEffect(() => {
    // consent is null until CookieConsentProvider resolves — ignore that.
    if (consent === null) return

    if (consent.analytics) {
      // Upgrade to full tracking
      posthog.opt_in_capturing()
      posthog.set_config({
        disable_session_recording: false,
        person_profiles: 'identified_only',
      })
    } else {
      // Downgrade to anonymous-only tracking
      // Keep opt_in so $pageview still fires, but disable all identifying features.
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
