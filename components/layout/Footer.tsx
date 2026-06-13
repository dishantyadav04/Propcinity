'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'

export default function Footer() {
  const pathname = usePathname()
  const year = new Date().getFullYear()
  const { openPreferences } = useCookieConsent()

  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  return (
    <footer className="hidden md:block border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span
              className="text-base font-black text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Prop<span className="text-[var(--primary)]">cinity</span>
            </span>
            <p className="text-xs text-[var(--text-muted)]">Zero brokerage. Buyer-first. Always.</p>
          </div>

          <nav className="flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
            <Link href="/explore" className="hover:text-[var(--primary)] transition-colors">Explore</Link>
            <Link href="/ai-chat" className="hover:text-[var(--primary)] transition-colors">AI Chat</Link>
            <Link href="/compare" className="hover:text-[var(--primary)] transition-colors">Compare</Link>
            <Link href="/contact" className="hover:text-[var(--primary)] transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms</Link>
            <button
              onClick={openPreferences}
              className="hover:text-[var(--primary)] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Cookie Preferences
            </button>
          </nav>

          <p className="text-xs text-[var(--text-muted)]">
            &copy; {year} Propcinity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
