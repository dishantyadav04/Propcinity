'use client'

import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-16 h-16 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
        <Mail className="w-8 h-8 text-[var(--primary)]" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-black text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}>
          Check your email
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          We&apos;ve sent a confirmation link to your email address.
          Click the link to activate your account — you&apos;ll be taken directly to set your property preferences.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Didn&apos;t get it? Check your spam folder. The link expires in 1 hour.
        </p>
      </div>
      <Link href="/auth/signup"
        className="flex items-center justify-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign up
      </Link>
    </div>
  )
}
