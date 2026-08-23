'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface GuestGateProps {
  children: React.ReactNode
  isGuest: boolean
  label?: string           // e.g. "Sign up to unlock filters"
  blur?: boolean           // true = blur children behind overlay (default)
  inline?: boolean         // true = compact inline chip style instead of overlay
}

export default function GuestGate({
  children,
  isGuest,
  label = 'Complete your profile to unlock',
  blur = true,
  inline = false,
}: GuestGateProps) {
  if (!isGuest) return <>{children}</>

  if (inline) {
    // Small inline chip — used for buttons/icons
    return (
      <div className="relative inline-flex items-center">
        <div className="opacity-30 pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </div>
      </div>
    )
  }

  // Full overlay mode — wraps a section.
  // The blur and lock overlay animate in over ~200ms instead of snapping,
  // so the unlock→lock flip while the guest check resolves reads as an
  // intentional transition rather than a flicker.
  return (
    <div className="relative">
      {blur && (
        <motion.div
          className="pointer-events-none select-none"
          initial={{ filter: 'blur(0px)', opacity: 1 }}
          animate={{ filter: 'blur(6px)', opacity: 0.35 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      )}
      <motion.div
        className={`${blur ? 'absolute inset-0' : ''} flex flex-col items-center justify-center gap-3 p-6 text-center`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-10 h-10 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center">
          <Lock className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-secondary)] max-w-[200px] leading-snug">
          {label}
        </p>
        <Link
          href="/onboarding"
          className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)]"
        >
          Get Started — Free
        </Link>
      </motion.div>
    </div>
  )
}
