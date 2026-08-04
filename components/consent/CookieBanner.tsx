'use client'

import { useState, useRef, useEffect } from 'react'
import { Lock, X } from 'lucide-react'
import { CookieConsent } from '@/lib/cookie-consent'

interface CookieBannerProps {
  onAcceptAll: () => void
  onEssentialOnly: () => void
  onUpdatePreferences: (prefs: Omit<CookieConsent, 'essential' | 'version' | 'timestamp'>) => void
  onOpenPreferences: () => void
  showModal: boolean
  onCloseModal: () => void
  hasExistingConsent: boolean
}

export default function CookieBanner({
  onAcceptAll,
  onEssentialOnly,
  onUpdatePreferences,
  onOpenPreferences,
  showModal,
  onCloseModal,
  hasExistingConsent,
}: CookieBannerProps) {
  const [prefs, setPrefs] = useState({ analytics: false, functional: false })
  const modalRef = useRef<HTMLDivElement>(null)
  const prevFocusedRef = useRef<HTMLElement | null>(null)
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (showModal) {
      prevFocusedRef.current = document.activeElement as HTMLElement
      const timer = setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else if (prevFocusedRef.current) {
      prevFocusedRef.current.focus()
      prevFocusedRef.current = null
    }
  }, [showModal])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showModal) return
    if (e.key === 'Escape' && hasExistingConsent) {
      onCloseModal()
      return
    }
    if (e.key === 'Tab') {
      if (!firstFocusableRef.current || !lastFocusableRef.current) return
      if (e.shiftKey && document.activeElement === firstFocusableRef.current) {
        e.preventDefault()
        lastFocusableRef.current.focus()
      } else if (!e.shiftKey && document.activeElement === lastFocusableRef.current) {
        e.preventDefault()
        firstFocusableRef.current.focus()
      }
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && hasExistingConsent) {
      onCloseModal()
    }
  }

  const handleSave = () => {
    onUpdatePreferences({ analytics: prefs.analytics, functional: prefs.functional })
  }

  return (
    <>
      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 motion-safe:animate-slide-up"
        role="dialog"
        aria-modal="false"
        aria-label="Cookie consent"
      >
        <div className="bg-[var(--surface-dark)] border-t border-[var(--border)] backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0">
                P
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-inverse)]" style={{ fontFamily: 'var(--font-display)' }}>
                  We use cookies to improve your experience
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                  Essential cookies for security and auth. Analytics and functional cookies help us improve the product. You&apos;re in control.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                onClick={onAcceptAll}
                className="px-5 py-2 bg-[var(--primary)] text-white font-bold text-sm rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity"
              >
                Accept All
              </button>
              <button
                onClick={onEssentialOnly}
                className="px-5 py-2 border border-[var(--border)] text-[var(--text-muted)] font-semibold text-sm rounded-[var(--radius-sm)] hover:text-[var(--text-inverse)] hover:border-[var(--text-muted)] transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={onOpenPreferences}
                className="px-2 py-2 text-[var(--primary)] font-semibold text-sm underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                Manage Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
        >
          <div
            ref={modalRef}
            className="bg-[var(--surface-dark)] border border-[var(--border)] rounded-[var(--radius-lg)] w-full max-w-md p-6 text-[var(--text-inverse)] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>
                Cookie Preferences
              </h2>
              {hasExistingConsent && (
                <button
                  onClick={onCloseModal}
                  ref={firstFocusableRef}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-inverse)] transition-colors rounded"
                  aria-label="Close preferences"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Control how Propcinity uses cookies on your device. Your choices are saved locally.
            </p>

            {/* Essential */}
            <div className="flex items-start gap-3 py-3 border-b border-[var(--border)]">
              <Lock className="w-5 h-5 mt-0.5 text-[var(--primary)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>Essential</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Required for the site to work. Cannot be disabled.</p>
              </div>
              <span className="px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold rounded-full shrink-0">Always On</span>
            </div>

            {/* Analytics */}
            <div className="flex items-start gap-3 py-3 border-b border-[var(--border)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>Analytics</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Helps us understand how visitors use Propcinity. No personally identifiable data is shared.</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.analytics}
                onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface-dark)] ${prefs.analytics ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${prefs.analytics ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Functional */}
            <div className="flex items-start gap-3 py-3 border-b border-[var(--border)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>Functional</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Improves your experience by remembering your preferences and enabling features like AI chat.</p>
              </div>
              <button
                role="switch"
                aria-checked={prefs.functional}
                onClick={() => setPrefs((p) => ({ ...p, functional: !p.functional }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface-dark)] ${prefs.functional ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${prefs.functional ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSave}
                ref={lastFocusableRef}
                className="flex-1 py-2.5 bg-[var(--primary)] text-white font-bold text-sm rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity"
              >
                Save Preferences
              </button>
              <button
                onClick={() => { if (hasExistingConsent) onCloseModal() }}
                className="flex-1 py-2.5 border border-[var(--border)] text-[var(--text-muted)] font-semibold text-sm rounded-[var(--radius-sm)] hover:text-[var(--text-inverse)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
