'use client'

import { useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '@/lib/storage'

export function useGuestMode() {
  // null = not yet checked (first render, localStorage not read yet)
  // true = confirmed guest (onboarding not done)
  // false = confirmed registered (onboarding done)
  const [isGuest, setIsGuest] = useState<boolean | null>(null)

  useEffect(() => {
    const done = storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false)
    setIsGuest(!done)
  }, [])

  return {
    isGuest: isGuest === true,        // only true AFTER confirmed as guest
    isRegistered: isGuest === false,  // only true AFTER confirmed as registered
    isChecking: isGuest === null,     // true during the first render window
  }
}
