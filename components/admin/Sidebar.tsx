'use client'

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Building2, HardHat,
  Users, MessageSquare, Settings, LogOut, ExternalLink, Mail, X, Newspaper
} from "lucide-react"
import { cn } from "@/lib/utils"

const ADMIN_NAV = [
  { label: 'Overview',  href: '/admin',              icon: LayoutDashboard },
  { label: 'Projects',  href: '/admin/projects',      icon: Building2 },
  { label: 'Blogs',     href: '/admin/blogs',          icon: Newspaper },
  { label: 'Builders',  href: '/admin/builders',      icon: HardHat },
  { label: 'Leads',     href: '/admin/leads',         icon: MessageSquare },
  { label: 'Contact',   href: '/admin/contact',       icon: Mail },
  { label: 'Users',     href: '/admin/users',         icon: Users },
  { label: 'Settings',  href: '/admin/settings',      icon: Settings },
]

function SidebarContent({ onNavClick, showHeader = true }: { onNavClick?: () => void; showHeader?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href)

  const signOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // Proceed with redirect even if the request fails
    }
    router.replace('/admin/login')
  }

  return (
    <>
      {showHeader && (
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3" onClick={onNavClick}>
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center
              justify-center text-white font-black text-sm flex-shrink-0">P</div>
            <div>
              <span className="text-sm font-black text-white tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}>
                Prop<span className="text-[var(--primary)]">cinity</span>
              </span>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                Admin
              </p>
            </div>
          </Link>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {ADMIN_NAV.map(item => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all",
                active
                  ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        <Link href="/" target="_blank"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
            text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
          <ExternalLink className="w-4 h-4" /> View Site
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
            text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </>
  )
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleMobileNavClick = () => onClose()

  return (
    <>
      {/* Desktop sidebar — always visible, zero dependency on open state */}
      <aside className="hidden md:flex flex-col bg-[#0E0E14] w-60 sticky top-0 z-0 h-dvh">
        <SidebarContent />
      </aside>

      {/* Mobile drawer — controlled by open state */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 bg-[#0E0E14] flex flex-col w-60 h-dvh transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3" onClick={handleMobileNavClick}>
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center
              justify-center text-white font-black text-sm flex-shrink-0">P</div>
            <div>
              <span className="text-sm font-black text-white tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}>
                Prop<span className="text-[var(--primary)]">cinity</span>
              </span>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                Admin
              </p>
            </div>
          </Link>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent onNavClick={handleMobileNavClick} showHeader={false} />
      </aside>
    </>
  )
}
