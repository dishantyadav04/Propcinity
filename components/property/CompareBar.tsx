'use client';

import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { X, Scale, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/finance-calculations";

const MAX_COMPARE = 5;

export default function CompareBar() {
  const [compareItems, setCompareItems] = useState<Project[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('compareItems') || '[]');
    setCompareItems(items);
    if (items.length > 0) setIsVisible(true);

    const handleUpdate = () => {
      const updated = JSON.parse(localStorage.getItem('compareItems') || '[]');
      setCompareItems(updated);
      if (updated.length > 0) setIsVisible(true);
      else setIsVisible(false);
    };

    window.addEventListener('compareUpdated', handleUpdate);
    return () => window.removeEventListener('compareUpdated', handleUpdate);
  }, []);

  const removeItem = (id: string) => {
    const updated = compareItems.filter(item => item.id !== id);
    localStorage.setItem('compareItems', JSON.stringify(updated));
    setCompareItems(updated);
    window.dispatchEvent(new Event('compareUpdated'));
  };

  const clearAll = () => {
    localStorage.setItem('compareItems', '[]');
    setCompareItems([]);
    setIsVisible(false);
    window.dispatchEvent(new Event('compareUpdated'));
  };

  if (!isVisible || compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-[var(--border)]
          shadow-2xl rounded-[var(--radius-lg)] p-4 max-w-5xl w-full"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">

          {/* Left info */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="font-black text-[var(--text-primary)] text-sm whitespace-nowrap">
                Compare Projects
              </p>
              <p className="text-xs text-[var(--text-muted)] font-bold">
                {compareItems.length} of {MAX_COMPARE} selected
              </p>
            </div>
          </div>

          {/* Slots */}
          <div className="flex-1 w-full flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {compareItems.map(item => {
                const minPrice = item.unitConfigs.length
                  ? Math.min(...item.unitConfigs.map(u => u.priceMin)) : 0;
                return (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative flex-shrink-0 w-32 sm:w-40 bg-[var(--surface-raised)]
                      border border-[var(--border)] rounded-[var(--radius-xs)] p-2 pr-6"
                  >
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                    <p className="text-[10px] text-[var(--primary)] font-black">{formatINR(minPrice)}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)]
                        hover:bg-black/5 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                );
              })}
              {/* Empty slots up to max */}
              {Array.from({ length: MAX_COMPARE - compareItems.length }).map((_, i) => (
                <motion.div
                  layout
                  key={`empty-${i}`}
                  className="flex-shrink-0 w-32 sm:w-40 border-2 border-dashed border-[var(--border)]
                    rounded-[var(--radius-xs)] p-2 flex items-center justify-center opacity-50"
                >
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Add project</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
            <button onClick={clearAll}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)]
                rounded-[var(--radius-xs)] transition-colors" title="Clear all">
              <Trash2 className="w-4 h-4" />
            </button>
            <Link
              href={`/compare?ids=${compareItems.map(i => i.id).join(',')}`}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius)] font-black text-sm transition-all
                ${compareItems.length > 1
                  ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-primary)] hover:opacity-90'
                  : 'bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              onClick={e => { if (compareItems.length < 2) e.preventDefault(); }}
            >
              Compare <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
