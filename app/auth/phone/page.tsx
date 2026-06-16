'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateUserPhone } from '@/lib/supabase-auth'

function PhoneContent() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/onboarding'

  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isValid = /^[6-9]\d{9}$/.test(phone)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Please enter a valid 10-digit Indian mobile number.')
      return
    }
    setIsLoading(true)
    try {
      await updateUserPhone(`+91${phone}`)
      router.push(next.startsWith('/') ? next : '/onboarding')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save phone number.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            One last step
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            We need your phone number to connect you with advisors.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Your number is only shared with a builder when <span className="font-semibold">you</span> choose
            to enquire about a property. We never sell or market it.{' '}
            <Link href="/privacy" className="underline hover:text-[var(--primary)] transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-semibold">+91</span>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              type="tel"
              required
              pattern="[0-9]{10}"
              className="w-full pl-16 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button type="submit" disabled={!isValid || isLoading}
            className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]
              text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Continue'}
          </button>
          <p className="text-xs text-center text-[var(--text-muted)]">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline hover:text-[var(--primary)]">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-[var(--primary)]">Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          <Link href={next.startsWith('/') ? next : '/onboarding'}
            className="text-[var(--primary)] hover:underline font-semibold">
            Skip for now
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function PhonePage() {
  return <Suspense><PhoneContent /></Suspense>
}
// ✅ TASK 2 DONE
