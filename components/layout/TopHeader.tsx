'use client';

import { Search, Bell, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (pathname.startsWith('/admin') || pathname === '/' || pathname === '/onboarding') return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center flex-shrink-0">
          <span className="text-xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Prop<span className="text-[var(--primary)]">IQ</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Explore', href: '/explore' },
            { label: 'Saved', href: '/saved' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`px-4 py-2 rounded-[var(--radius-xs)] text-sm font-semibold transition-colors ${
                pathname === item.href
                  ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search + Actions */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-48 sm:w-64 px-3 py-1.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)] rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
              <button type="button" onClick={() => setSearchOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
              <Search className="w-5 h-5" />
            </button>
          )}
          <Link href="/profile"
            className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-xs font-bold">
            P
          </Link>
        </div>
      </div>
    </header>
  );
}
