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
          We&apos;ve sent a confirmation link to your email. Click it to activate your account, then come back to set your property preferences.
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Didn&apos;t get it? Check your spam folder. The link expires in 1 hour.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/auth/signin"
          className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)] text-sm text-center">
          I&apos;ve confirmed my email — Sign in
        </Link>
        <Link href="/auth/signup"
          className="flex items-center justify-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign up
        </Link>
      </div>
    </div>
  )
}
