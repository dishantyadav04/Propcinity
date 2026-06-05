'use client'

import { useEffect, useState } from 'react'
import { storage, STORAGE_KEYS } from '@/lib/storage'

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState(true) // default true until we check

  useEffect(() => {
    const done = storage.get<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false)
    setIsGuest(!done)
  }, [])

  return { isGuest }
}
