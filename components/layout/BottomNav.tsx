'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore', icon: Search },
  { label: 'Saved', href: '/saved', icon: Heart },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on admin routes or landing
  if (pathname.startsWith('/admin') || pathname === '/') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)] px-6">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all relative py-2",
                isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive ? "fill-[var(--primary)]/10" : "")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--primary)] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
