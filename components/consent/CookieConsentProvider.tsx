'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getConsent, setConsent, CookieConsent } from '@/lib/cookie-consent'
import CookieBanner from './CookieBanner'

interface CookieConsentContextValue {
  consent: CookieConsent | null
  updateConsent: (prefs: Omit<CookieConsent, 'essential' | 'version' | 'timestamp'>) => void
  showBanner: boolean
  openPreferences: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return ctx
}

export default function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const existing = getConsent()
    setConsentState(existing)
    if (!existing) {
      setShowBanner(true)
    }
  }, [])

  const updateConsent = useCallback((prefs: Omit<CookieConsent, 'essential' | 'version' | 'timestamp'>) => {
    setConsent(prefs)
    const updated = getConsent()
    setConsentState(updated)
    setShowBanner(false)
    setShowModal(false)
    setShowPreferencesModal(false)
  }, [])

  const openPreferences = useCallback(() => {
    setShowPreferencesModal(true)
    if (!consent) {
      setShowBanner(true)
    }
  }, [consent])

  return (
    <CookieConsentContext.Provider value={{ consent, updateConsent, showBanner, openPreferences }}>
      {children}
      {mounted && (showBanner || showPreferencesModal) && (
        <CookieBanner
          onAcceptAll={() => updateConsent({ analytics: true, functional: true })}
          onEssentialOnly={() => updateConsent({ analytics: false, functional: false })}
          onUpdatePreferences={(prefs) => updateConsent(prefs)}
          onOpenPreferences={() => setShowModal(true)}
          showModal={showPreferencesModal || showModal}
          onCloseModal={() => {
            setShowModal(false)
            setShowPreferencesModal(false)
          }}
          hasExistingConsent={!!consent}
        />
      )}
    </CookieConsentContext.Provider>
  )
}
