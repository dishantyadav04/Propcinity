'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Project } from "@/types/project";
import { X, Scale, ArrowRight, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatINR } from "@/lib/finance-calculations";
import { usePathname } from "next/navigation";

import { storage, STORAGE_KEYS } from "@/lib/storage";

const MAX_COMPARE = 5;

export default function CompareBar() {
  const [compareItems, setCompareItems] = useState<Project[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const load = () => {
      const items = storage.get<Project[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
      setCompareItems(items);
    };
    load();
    window.addEventListener('compareUpdated', load);
    return () => window.removeEventListener('compareUpdated', load);
  }, []);

  // Auto-collapse when user scrolls down, expand when scrolls up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 20 && currentY > 100) {
        setIsExpanded(false); // scrolling down — collapse
        setIsScrolled(true);
      } else if (currentY < lastScrollY.current - 20) {
        setIsScrolled(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const removeItem = (id: string) => {
    const updated = compareItems.filter(item => item.id !== id);
    storage.set(STORAGE_KEYS.COMPARE_ITEMS, updated);
    setCompareItems(updated);
    window.dispatchEvent(new Event('compareUpdated'));
  };

  const clearAll = () => {
    storage.set(STORAGE_KEYS.COMPARE_ITEMS, []);
    setCompareItems([]);
    window.dispatchEvent(new Event('compareUpdated'));
  };

  // Don't show on compare page itself
  if (pathname === '/compare') return null;
  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[60] flex justify-center px-2 sm:px-4 pb-2">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-3xl"
      >
        {/* Collapsed pill — shown when scrolled down */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="pill"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setIsExpanded(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5
                bg-[var(--surface-dark)] text-white rounded-full shadow-2xl
                border border-white/10 text-sm font-black"
            >
              <Scale className="w-4 h-4 text-[var(--primary)]" />
              {compareItems.length} project{compareItems.length !== 1 ? 's' : ''} in compare
              <ChevronUp className="w-4 h-4 text-white/60" />
            </motion.button>
          ) : (
            <motion.div
              key="bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/97 backdrop-blur-xl border border-[var(--border)]
                shadow-2xl rounded-[var(--radius-lg)] overflow-hidden"
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-black text-[var(--text-primary)]">
                    Compare ({compareItems.length}/{MAX_COMPARE})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearAll}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)]
                      hover:bg-[var(--danger-light)] rounded-[var(--radius-xs)] transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsExpanded(false)}
                    className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-raised)]
                      rounded-[var(--radius-xs)] transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Project slots */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full sm:flex-1 min-w-0 pb-1 sm:pb-0">
                  <AnimatePresence mode="popLayout">
                    {compareItems.map(item => {
                      const minPrice = (item.unitConfigs || []).length
                        ? Math.min(...item.unitConfigs.map(u => u.priceMin)) : 0;
                      return (
                        <motion.div key={item.id} layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex-shrink-0 flex items-center gap-2 bg-[var(--surface-raised)]
                            border border-[var(--border)] rounded-[var(--radius-xs)] px-2.5 py-1.5 pr-7 relative">
                          <div className="w-7 h-7 rounded overflow-hidden bg-[var(--border)] flex-shrink-0 relative">
                            {item.images?.[0] && (
                              <Image
                                src={item.images[0]}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="28px"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-[90px]">{item.name}</p>
                            <p className="text-[9px] text-[var(--primary)] font-black">{formatINR(minPrice)}</p>
                          </div>
                          <button onClick={() => removeItem(item.id)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5
                              text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      );
                    })}

                    {/* Show ONE empty slot if below max */}
                    {compareItems.length < MAX_COMPARE && (
                      <Link href="/explore"
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-2
                          border border-dashed border-[var(--border-strong)] rounded-[var(--radius-xs)]
                          text-[10px] font-bold text-[var(--text-muted)] hover:border-[var(--primary)]
                          hover:text-[var(--primary)] transition-colors whitespace-nowrap">
                        + Add
                      </Link>
                    )}
                  </AnimatePresence>
                </div>

                {/* Compare button — always visible */}
                <Link
                  href="/compare"
                  className={`flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5
                    px-4 py-3 sm:py-2.5 rounded-[var(--radius)] font-black text-sm transition-all ${
                    compareItems.length >= 2
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-primary)] hover:opacity-90'
                      : 'bg-[var(--surface-raised)] text-[var(--text-muted)] pointer-events-none'
                  }`}>
                  <span>Compare</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {compareItems.length < 2 && (
                <p className="text-[10px] text-[var(--text-muted)] text-center pb-3 px-4 font-medium">
                  Add {2 - compareItems.length} more project{compareItems.length === 1 ? '' : 's'} to compare
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
