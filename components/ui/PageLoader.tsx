'use client';

import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)] flex items-center justify-center">
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="flex items-center gap-1 text-3xl font-bold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span>Prop</span>
        <span className="text-[var(--primary)]">IQ</span>
      </motion.div>
    </div>
  );
}
