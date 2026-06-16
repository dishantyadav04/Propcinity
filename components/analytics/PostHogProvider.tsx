'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'

function PostHogInit() {
  const { consent } = useCookieConsent()

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key || !host) return

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'memory',
        person_profiles: 'identified_only',
      })
    }

    if (consent?.analytics) {
      posthog.set_config({ persistence: 'localStorage+cookie' })
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
// ✅ TASK 1 DONE
