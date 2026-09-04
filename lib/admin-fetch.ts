'use client'

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { credentials: 'include', ...init })

  if (res.status === 401 && typeof window !== 'undefined') {
    const from = window.location.pathname
    window.location.replace(`/admin/login?from=${encodeURIComponent(from)}`)
    throw new Error('Unauthorized — redirecting to login')
  }

  return res
}
