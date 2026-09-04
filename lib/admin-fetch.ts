'use client'

import { toast } from 'sonner'

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { credentials: 'include', ...init })

  if (res.status === 401 && typeof window !== 'undefined') {
    toast.error('Your session expired — signing you back in.')
    const from = window.location.pathname
    window.location.replace(`/admin/login?from=${encodeURIComponent(from)}`)
    throw new Error('Unauthorized — redirecting to login')
  }

  return res
}
