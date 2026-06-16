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
        api_host: host,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
        opt_out_capturing_by_default: true,
      })
    }

    if (consent?.analytics) {
      posthog.opt_in_capturing()
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
