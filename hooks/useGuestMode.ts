'use client'

import { useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import { createClient } from '@/lib/supabase'

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const localDone = storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false)
      if (localDone) {
        if (!cancelled) setIsGuest(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          storage.set(STORAGE_KEYS.ONBOARDING_DONE, true)
          if (!cancelled) setIsGuest(false)
          return
        }
      } catch {
        // Supabase unavailable — fall through to guest
      }

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
