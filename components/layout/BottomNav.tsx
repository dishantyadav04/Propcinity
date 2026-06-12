'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Sparkles, GitCompareArrows, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuestMode } from "@/hooks/useGuestMode";

const GUEST_NAV_ITEMS = [
  { label: 'Sign Up', href: '/onboarding', icon: LogIn },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'AI Chat', href: '/ai-chat', icon: Sparkles },
  { label: 'Compare', href: '/compare', icon: GitCompareArrows },
];

const USER_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'AI Chat', href: '/ai-chat', icon: Sparkles },
  { label: 'Compare', href: '/compare', icon: GitCompareArrows },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isGuest: isGuestRaw, isChecking } = useGuestMode();
  const isGuest = !isChecking && isGuestRaw;
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname === '/onboarding' ||
    pathname === '/privacy' ||
    pathname === '/terms'
  ) return null;

  const resolvedItems = isGuest ? GUEST_NAV_ITEMS : USER_NAV_ITEMS;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-4">
        {resolvedItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-[var(--radius-xs)] transition-all",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-muted)]"
              )}>
              <item.icon className={cn("w-5 h-5", isActive && "fill-[var(--primary)]/10")} />
              <span className={cn("text-[10px] font-bold", isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
