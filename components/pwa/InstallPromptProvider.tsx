'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import InstallBanner from './InstallBanner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptContextValue {
  promptInstall: () => void
  canInstall: boolean
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null)

export function useInstallPrompt() {
  const ctx = useContext(InstallPromptContext)
  if (!ctx) throw new Error('useInstallPrompt must be used within InstallPromptProvider')
  return ctx
}

const DISMISS_KEY = 'propcinity_install_dismissed_at'
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export default function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) return

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShowBanner(false)
  }, [])

  return (
    <InstallPromptContext.Provider value={{ promptInstall, canInstall: !!deferredPrompt }}>
      {children}
      {showBanner && deferredPrompt && (
        <InstallBanner onInstall={promptInstall} onDismiss={dismiss} />
      )}
    </InstallPromptContext.Provider>
  )
}
