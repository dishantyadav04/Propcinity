'use client';

import { ShieldCheck, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ZeroBrokerageBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isShown = localStorage.getItem("zeroBrokerageShown");
    if (!isShown) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("zeroBrokerageShown", "true");
  };

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(handleDismiss, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 z-50 left-0 right-0 mx-6 pointer-events-none"
        >
          <div className="glass-strong rounded-[24px] px-5 py-4 flex items-center justify-between gap-4 shadow-2xl pointer-events-auto max-w-sm mx-auto border-black/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--success)]/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-primary)] tracking-tight">Zero Brokerage Guarantee</p>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[var(--warning)] fill-[var(--warning)]" />
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Free for all buyers</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="p-2 hover:bg-black/5 rounded-xl transition-colors interactive"
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
