'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  missing_auth_code: 'The sign-in link is incomplete. Please try again.',
  service_unavailable: 'Our service is temporarily unavailable. Try again in a moment.',
  session_failed: 'Could not establish a session. Please try again.',
  invalid_confirmation_link: 'This confirmation link is invalid or has expired.',
  access_denied: "You cancelled sign-in. No problem — try again when you're ready.",
}

function ErrorContent() {
  const params = useSearchParams()
  const rawMessage = params.get('message') ?? 'unknown_error'
  const message = ERROR_MESSAGES[rawMessage] ?? decodeURIComponent(rawMessage)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-14 h-14 bg-[var(--danger-light)] rounded-full flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-[var(--danger)]" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-black text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}>
          Sign-in failed
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/auth/signin"
          className="px-6 py-2.5 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)] text-sm">
          Try signing in again
        </Link>
        <Link href="/"
          className="px-6 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] font-bold rounded-[var(--radius)] text-sm">
          Go home
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}
