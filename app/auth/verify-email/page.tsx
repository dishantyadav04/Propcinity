'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { resendConfirmationEmail } from '@/lib/supabase-auth'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setEmail(sessionStorage.getItem('signup_email') ?? '')
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleResend = async () => {
    if (!email) { toast.error('Email not found. Please sign up again.'); return }
    setSending(true)
    try {
      await resendConfirmationEmail(email)
      toast.success('Confirmation email resent!')
      setCooldown(60)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend.')
    } finally {
      setSending(false)
    }
  }

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
      <button
        onClick={handleResend}
        disabled={sending || cooldown > 0}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]
          text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Resending...</>
        ) : cooldown > 0 ? (
          `Resend available in ${cooldown}s`
        ) : (
          'Resend email'
        )}
      </button>
      <Link href="/auth/signup"
        className="flex items-center justify-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign up
      </Link>
    </div>
  )
}
