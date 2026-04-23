import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-9xl font-black text-[var(--border-strong)]"
        style={{ fontFamily: 'var(--font-display)' }}>404</h1>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4 mb-2">Page Not Found</h2>
      <p className="text-[var(--text-secondary)] max-w-sm mx-auto mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/dashboard"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity">
        <Home className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
