'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { signInWithEmail, signInWithGoogle, signInWithApple } from '@/lib/supabase-auth'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import { Suspense } from 'react'

function SignInContent() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmail(form.email, form.password)
      storage.set(STORAGE_KEYS.ONBOARDING_DONE, true)
      router.push(next.startsWith('/') ? next : '/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setOauthLoading('google')
    try { await signInWithGoogle(next) } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed.')
      setOauthLoading(null)
    }
  }

  const handleApple = async () => {
    setOauthLoading('apple')
    try { await signInWithApple(next) } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Apple sign-in failed.')
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">cinity</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Sign in to your account</p>
        </div>

        <div className="space-y-3">
          <button onClick={handleGoogle} disabled={!!oauthLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white
              border-2 border-[var(--border-strong)] rounded-[var(--radius)]
              hover:border-[var(--primary)] transition-colors font-semibold text-sm
              disabled:opacity-60 disabled:cursor-not-allowed">
            {oauthLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin" />
              : <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>}
            {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <button
            onClick={handleApple}
            disabled={!!oauthLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3
              bg-black text-white rounded-[var(--radius)]
              hover:opacity-90 transition-opacity font-semibold text-sm
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {oauthLoading === 'apple'
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : (
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )
            }
            {oauthLoading === 'apple' ? 'Redirecting...' : 'Continue with Apple'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)] font-semibold">or sign in with email</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="Email address" type="email" required
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius)] text-sm focus:outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Password" type={showPassword ? 'text' : 'password'} required
              className="w-full pl-10 pr-10 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                rounded-[var(--radius)] text-sm focus:outline-none focus:border-[var(--primary)]" />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-right">
            <Link href="/auth/forgot-password"
              className="text-xs text-[var(--primary)] hover:underline font-semibold">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isLoading || !!oauthLoading}
            className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]
              text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-[var(--primary)] font-bold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return <Suspense><SignInContent /></Suspense>
}
