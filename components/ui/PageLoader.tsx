'use client';

import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--background)] flex items-center justify-center">
       <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent blur-3xl" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-[var(--primary-glow)]">
          <span className="font-black text-4xl">P</span>
        </div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xs font-black uppercase tracking-[0.4em] text-[var(--primary)]"
        >
          Analyzing Data
        </motion.div>
      </motion.div>
    </div>
  );
}
