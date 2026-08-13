'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useState } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'
import { getConsent } from '@/lib/cookie-consent'

let initialPageviewFired = false

function initPostHog() {
  if (typeof window === 'undefined') return null

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set — analytics is disabled. ' +
        'Add it to .env.local to enable PostHog in development.'
      )
    }
    return null
  }

  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://ingest.propcinity.in',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? 'https://us.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: { password: true, email: false },
      },
      on_xhr_error: () => { },
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

    if (!initialPageviewFired) {
      initialPageviewFired = true
      posthog.capture('$pageview', { $current_url: window.location.href })
    }
  }

  return posthog
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [phClient, setPhClient] = useState(() => initPostHog())
  const { consent } = useCookieConsent()

  useEffect(() => {
    if (!phClient) {
      setPhClient(initPostHog())
    }
  }, [phClient])

  useEffect(() => {
    if (consent === null || !phClient) return
    if (!phClient.__loaded) return

    if (consent.analytics) {
      phClient.opt_in_capturing()
      phClient.set_config({
        disable_session_recording: false,
        person_profiles: 'identified_only',
      })
    } else {
      phClient.opt_in_capturing()
      phClient.set_config({
        disable_session_recording: true,
        person_profiles: 'never',
      })
    }
  }, [consent, phClient])

  if (!phClient) {
    return <>{children}</>
  }

  return (
    <PHProvider client={phClient}>
      {children}
    </PHProvider>
  )
}