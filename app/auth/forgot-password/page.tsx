'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { resetPassword } from '@/lib/supabase-auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <div className="w-14 h-14 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
          <Mail className="w-7 h-7 text-[var(--primary)]" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Check your inbox
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            We sent a password reset link to <strong>{email}</strong>.
            The link expires in 1 hour.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Didn&apos;t get it? Check your spam folder.
          </p>
        </div>
        <Link href="/auth/signin"
          className="flex items-center gap-1.5 text-sm text-[var(--primary)] font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">cinity</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]
              text-sm hover:opacity-90 transition-opacity disabled:opacity-60
              flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          Remembered it?{' '}
          <Link href="/auth/signin" className="text-[var(--primary)] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
