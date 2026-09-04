'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
        <svg
          className="h-8 w-8 text-[#FF4500]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-gray-900">You're offline</h1>
      <p className="max-w-sm text-gray-500">
        Looks like you've lost your connection. Check it and try again — pages you've
        already visited may still be available.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-full bg-[#FF4500] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Retry
      </button>
    </div>
  )
}
