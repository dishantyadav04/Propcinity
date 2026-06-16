'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, useRef } from 'react'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'

function PostHogInit() {
  const { consent } = useCookieConsent()
  const initialPageviewFired = useRef(false)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key || !host) return

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: 'https://us.i.posthog.com',
        defaults: '2026-01-30',
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
        opt_out_capturing_by_default: true,
      })
    }

    if (consent?.analytics) {
      posthog.opt_in_capturing()

      if (!initialPageviewFired.current) {
        initialPageviewFired.current = true
        posthog.capture('$pageview', {
          $current_url: window.location.href,
        })
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
