'use client';

import { ShieldCheck, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ZeroBrokerageBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isShown = localStorage.getItem("zeroBrokerageShown");
    if (!isShown) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("zeroBrokerageShown", "true");
  };

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(handleDismiss, 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="fixed bottom-[72px] z-40 left-0 right-0 mx-4"
        >
          <div className="bg-[var(--success)]/10 backdrop-blur-md border-l-4 border-[var(--success)] rounded-[var(--radius)] px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--success)]/20 rounded-full">
                <ShieldCheck className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Zero brokerage.</p>
                <p className="text-xs text-[var(--text-secondary)]">Completely free for buyers.</p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
