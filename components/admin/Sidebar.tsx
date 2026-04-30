'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, HardHat,
  Users, MessageSquare, Settings, LogOut, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { label: 'Overview',  href: '/admin',              icon: LayoutDashboard },
  { label: 'Projects',  href: '/admin/projects',      icon: Building2 },
  { label: 'Builders',  href: '/admin/builders',      icon: HardHat },
  { label: 'Leads',     href: '/admin/leads',         icon: MessageSquare },
  { label: 'Users',     href: '/admin/users',         icon: Users },
  { label: 'Settings',  href: '/admin/settings',      icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-60 h-screen flex-shrink-0 bg-[#0E0E14] flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-3">
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {ADMIN_NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
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
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5 space-y-0.5">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
            text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
          <ExternalLink className="w-4 h-4" /> View Site
        </Link>
        <button
          onClick={() => {
            document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            window.location.href = '/admin';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold
            text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
