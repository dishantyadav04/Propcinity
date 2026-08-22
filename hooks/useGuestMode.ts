'use client'

import { useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import { createClient } from '@/lib/supabase'

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const hasOnboarding = storage.get<boolean | null>(STORAGE_KEYS.ONBOARDING_DONE, null);
      if (hasOnboarding === true) return false;
      if (hasOnboarding === false) return true;
    }
    return null;
  });

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const supabase = createClient()
        // Use getUser() — makes a server-validated network request
        // Never use getSession() for security decisions (client-side JWT decode only)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Only set localStorage AFTER server confirms valid session
          storage.set(STORAGE_KEYS.ONBOARDING_DONE, true)
          if (!cancelled) setIsGuest(false)
          return
        }
      } catch {
        // Supabase unavailable — fall through to guest mode
      }

      // Clear stale localStorage flag if session is invalid
      storage.remove(STORAGE_KEYS.ONBOARDING_DONE)
      if (!cancelled) setIsGuest(true)
    }

    check()
    return () => { cancelled = true }
  }, [])

  return {
    isGuest: isGuest === true,
    isRegistered: isGuest === false,
    isChecking: isGuest === null,
  }
}
