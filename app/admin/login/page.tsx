// app/admin/login/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck } from 'lucide-react'

type Step = 'password' | 'totp'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawFrom = searchParams?.get('from') || '/admin'
  const from = rawFrom.startsWith('/') && !rawFrom.startsWith('//') ? rawFrom : '/admin'

  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        step === 'password'
          ? { password }
          : { password, totpCode: totpCode.replace(/\s/g, '') }
      ),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok && data.success) {
      router.replace(from)
      return
    }

    if (res.ok && data.requireTotp) {
      // Password accepted — now ask for TOTP
      setStep('totp')
      setLoading(false)
      return
    }

    setError(data.error || 'Something went wrong. Try again.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[var(--primary)] rounded-2xl flex items-center
            justify-center text-white font-black text-3xl mx-auto shadow-[var(--shadow-primary)]">
            P
          </div>
          <h1
            className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Prop<span className="text-[var(--primary)]">cinity</span> Admin
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {step === 'password'
              ? 'Enter your admin password to continue'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {/* Step indicator (only shown when TOTP step reached) */}
        {step === 'totp' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius)]
            bg-[var(--surface-raised)] border border-[var(--border)]">
            <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <p className="text-xs text-[var(--text-secondary)]">
              Password accepted. Two-factor verification required.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          {step === 'password' ? (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              suppressHydrationWarning
              className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius)] text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]
                transition-colors"
            />
          ) : (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]*"
              maxLength={7}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/[^0-9 ]/g, ''))}
              placeholder="000 000"
              autoFocus
              suppressHydrationWarning
              className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius)] text-[var(--text-primary)] text-center text-2xl
                tracking-[0.3em] font-mono
                placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]
                transition-colors"
            />
          )}

          {error && (
            <p className="text-sm text-[var(--danger)] font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={step === 'password' ? !password || loading : totpCode.replace(/\s/g,'').length !== 6 || loading}
            className="w-full py-3 bg-[var(--primary)] text-white font-black
              rounded-[var(--radius)] disabled:opacity-50 transition-opacity
              hover:opacity-90 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading
              ? 'Verifying...'
              : step === 'password'
              ? 'Continue'
              : 'Verify & Enter'}
          </button>

          {step === 'totp' && (
            <button
              type="button"
              onClick={() => { setStep('password'); setTotpCode(''); setError('') }}
              className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]
                transition-colors text-center"
            >
              ← Back to password
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
