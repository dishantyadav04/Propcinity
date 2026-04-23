'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 bg-[var(--danger-light)] rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-[var(--danger)]" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2"
        style={{ fontFamily: 'var(--font-display)' }}>Something went wrong</h2>
      <p className="text-[var(--text-secondary)] max-w-sm mx-auto mb-8">
        We encountered an unexpected error. Our team has been notified.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center px-6 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
