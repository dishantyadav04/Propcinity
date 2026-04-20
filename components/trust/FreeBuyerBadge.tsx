'use client';

import { ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FreeBuyerBadgeProps {
  variant: 'pill' | 'inline' | 'card';
}

export default function FreeBuyerBadge({ variant }: FreeBuyerBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'pill') {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/30 px-3 py-1 text-xs font-medium text-[var(--success)]">
        ✓ 100% Free for Buyers
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
        <span>Free for buyers · We earn from builders</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-[var(--success)]/5 border border-[var(--success)]/20 rounded-[var(--radius)] overflow-hidden">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-semibold text-[var(--success)]">Why is this free?</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
          </motion.div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-4 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                We're channel partners. Builders pay us a commission when you buy. You pay zero brokerage. Ever.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
