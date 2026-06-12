'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/projects': 'Projects',
  '/admin/builders': 'Builders',
  '/admin/leads': 'Leads',
  '/admin/contact': 'Contact',
  '/admin/users': 'Users',
  '/admin/settings': 'Settings',
}

export default function AdminHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const title = Object.entries(PAGE_TITLES).reduce<string | undefined>(
    (found, [prefix, label]) => {
      if (pathname === prefix || pathname.startsWith(prefix + '/')) return label
      return found
    },
    undefined,
  )

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest hidden sm:inline">
            Admin
          </span>
          {title && (
            <>
              <span className="text-[var(--border-strong)] hidden sm:inline">/</span>
              <h1 className="text-sm font-bold text-[var(--text-primary)]">
                {title}
              </h1>
            </>
          )}
        </div>
      </div>

      <button
        onClick={async () => {
          try {
            await fetch('/api/admin/logout', { method: 'POST' })
          } catch {
            // Proceed with redirect even if the request fails
          }
          router.replace('/admin/login')
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-400
          border border-red-400/30 hover:border-red-400/60
          hover:bg-red-400/10 rounded-lg transition-all"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </header>
  )
}
