'use client'

import { X, Download } from 'lucide-react'

interface InstallBannerProps {
  onInstall: () => void
  onDismiss: () => void
}

export default function InstallBanner({ onInstall, onDismiss }: InstallBannerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
          <Download className="h-5 w-5 text-[#FF4500]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Install Propcinity</p>
          <p className="text-xs text-gray-500">Faster access, works offline too.</p>
        </div>
        <button
          onClick={onInstall}
          className="flex-shrink-0 rounded-full bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
