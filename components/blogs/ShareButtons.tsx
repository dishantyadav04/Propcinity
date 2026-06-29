'use client'

import { Share2, ExternalLink } from 'lucide-react'

export default function ShareButtons({ title }: { title: string }) {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  return (
    <div className="flex gap-2">
      <button
        onClick={() => navigator.share?.({ title, url }) ?? navigator.clipboard?.writeText(url)}
        className="inline-flex items-center gap-1 px-3 py-1.5 border border-[var(--border)] rounded-full text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>
      <button
        onClick={() => navigator.clipboard?.writeText(url)}
        className="inline-flex items-center gap-1 px-3 py-1.5 border border-[var(--border)] rounded-full text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" /> Copy Link
      </button>
    </div>
  )
}
