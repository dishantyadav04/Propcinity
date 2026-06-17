'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useRef } from 'react'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()
  // Skip the initial mount — PostHogProvider's `loaded` callback owns the
  // first $pageview. This component only handles subsequent client-side navigations.
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Guard: posthog must be loaded. No opt-out check here —
    // pageviews are anonymous and fire regardless of consent.
    if (!pathname || !posthog || !posthog.__loaded) return

    let url = window.location.origin + pathname
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
