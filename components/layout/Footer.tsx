'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCookieConsent } from '@/components/consent/CookieConsentProvider'

// Routes where BottomNav returns null — must be kept in sync with BottomNav.tsx
const NO_BOTTOM_NAV_ROUTES = ['/', '/onboarding', '/privacy-policy', '/terms-and-conditions', '/cookies']

export default function Footer() {
  const pathname = usePathname()
  const year = new Date().getFullYear()
  const { openPreferences } = useCookieConsent()

  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  // BottomNav renders on all routes EXCEPT /admin, /auth, and NO_BOTTOM_NAV_ROUTES
  const hasBottomNav =
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/auth') &&
    !NO_BOTTOM_NAV_ROUTES.includes(pathname)

  const linkClass =
    'text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors'

  const sectionHeadingClass =
    'text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3'

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <span
              className="text-lg font-black text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Prop<span className="text-[var(--primary)]">cinity</span>
            </span>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
              Zero brokerage. Buyer-first. Always.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className={sectionHeadingClass}>Explore</p>
            <ul className="space-y-2">
              <li><Link href="/explore" className={linkClass}>Explore</Link></li>
              <li><Link href="/ai-chat" className={linkClass}>AI Chat</Link></li>
              <li><Link href="/compare" className={linkClass}>Compare</Link></li>
              <li><Link href="/blogs" className={linkClass}>Blogs</Link></li>
              <li><Link href="/dashboard" className={linkClass}>Dashboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className={sectionHeadingClass}>Company</p>
            <ul className="space-y-2">
              <li><Link href="/about" className={linkClass}>About</Link></li>
              <li><Link href="/faq" className={linkClass}>FAQ</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className={sectionHeadingClass}>Legal</p>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className={linkClass}>Terms &amp; Conditions</Link></li>
              <li><Link href="/cookies" className={linkClass}>Cookie Policy</Link></li>
              <li>
                <button
                  onClick={openPreferences}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar — clearance padding only when BottomNav is actually rendered */}
      <div className="border-t border-[var(--border)]">
        <div
          className="max-w-6xl mx-auto px-6 pt-4 md:py-4"
          style={
            hasBottomNav
              ? {
                  paddingBottom:
                    'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 1rem)',
                }
              : { paddingBottom: '1rem' }
          }
        >
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {year} Propcinity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
