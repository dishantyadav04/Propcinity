'use client';

import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreeBuyerBadgeProps {
  variant?: 'inline' | 'default';
  className?: string;
}

export default function FreeBuyerBadge({ variant = 'default', className }: FreeBuyerBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs font-bold text-[var(--success)]",
      variant === 'default' && "bg-[var(--success-light)] px-2 py-1 rounded-[var(--radius-xs)]",
      className
    )}>
      <ShieldCheck className="w-4 h-4" />
      <span>100% Free Service for Buyers</span>
    </div>
  );
}
