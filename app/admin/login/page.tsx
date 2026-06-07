'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams?.get('from') || '/admin'
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.replace(from)
    } else {
      setError('Incorrect password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[var(--primary)] rounded-2xl flex items-center
            justify-center text-white font-black text-3xl mx-auto shadow-[var(--shadow-primary)]">
            P
          </div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">cinity</span> Admin
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Enter your admin password to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
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
          {error && (
            <p className="text-sm text-[var(--danger)] font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={!password || loading}
            className="w-full py-3 bg-[var(--primary)] text-white font-black
              rounded-[var(--radius)] disabled:opacity-50 transition-opacity
              hover:opacity-90 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in...' : 'Enter Admin'}
          </button>
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
