'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    // ✅ No isFirstRender guard — the initial mount IS the page load event and
    // must be captured. The old guard was discarding every hard-refresh pageview.
    if (!pathname || !posthog || !posthog.__loaded) return

    let url = window.location.origin + pathname
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
