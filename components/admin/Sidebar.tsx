'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building, Users, Settings, LogOut, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Projects', href: '/admin/projects', icon: Building },
  { label: 'Leads', href: '/admin/leads', icon: Users },
  { label: 'Score Calculator', href: '/admin/score-calculator', icon: Shield },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen sticky top-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col p-6 space-y-8 hidden md:flex">
      <Link href="/admin" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-black text-xl">P</div>
        <div className="flex flex-col">
          <span className="text-lg font-black text-[var(--text-primary)] tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>PropIQ</span>
          <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">Admin Console</span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                isActive 
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-[var(--border)] space-y-1">
        <Link 
          href="/dashboard"
          target="_blank"
          className="flex items-center justify-between px-4 py-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4" />
            <span>Visit Site</span>
          </div>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[var(--danger)] hover:bg-[var(--danger)]/5 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
