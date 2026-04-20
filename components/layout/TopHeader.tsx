'use client';

import { Bell, Search, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function TopHeader() {
  const pathname = usePathname();

  // Custom logic for different pages
  const isDashboard = pathname === '/dashboard';
  const isProjectDetail = pathname.startsWith('/projects/');

  if (pathname.startsWith('/admin') || pathname === '/' || pathname === '/onboarding') return null;

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)] px-6 py-4">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center text-white font-black text-lg">P</div>
          <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>PropIQ</span>
        </Link>

        <div className="flex items-center gap-4">
          <button className="p-2 text-[var(--text-secondary)]">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-[var(--text-secondary)] relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--danger)] rounded-full border-2 border-[var(--surface)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
