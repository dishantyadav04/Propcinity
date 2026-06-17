'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useRef } from 'react'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()
  // Skip the initial mount — PostHogProvider's `loaded` callback owns the
  // first $pageview. This component only handles client-side navigations.
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // By navigation time posthog is always loaded, but guard defensively.
    if (!pathname || !posthog || !posthog.__loaded) return

    // posthog respects opt-out internally — if analytics consent was
    // revoked, capture() is a no-op, so no extra consent check needed here.
    let url = window.location.origin + pathname
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
