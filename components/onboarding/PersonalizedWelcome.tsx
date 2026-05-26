'use client';

import { motion } from "framer-motion";
import { Sparkles, ArrowDown, Cpu } from "lucide-react";
import { UserIntent } from "@/types/user";
import { useEffect, useState } from "react";

import { storage, STORAGE_KEYS } from "@/lib/storage";

export default function PersonalizedWelcome() {
  const [intent, setIntent] = useState<UserIntent | null>(null);

  useEffect(() => {
    const saved = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
    if (saved) setIntent(saved);
  }, []);

  if (!intent) return null;

  return (
    <div className="relative overflow-hidden pt-12 pb-8 px-6">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-[80px] -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--success)]/5 rounded-full blur-[60px] -ml-24 -mb-24" />

      <div className="max-w-md mx-auto space-y-6 relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full"
        >
          <Cpu className="w-3 h-3 text-[var(--primary)]" />
          <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">AI Intelligence Engine</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-black text-[var(--text-primary)] leading-none tracking-tighter" style={{ fontFamily: 'var(--font-display)' }}>
            Curated Matches
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
            Optimized for <span className="text-[var(--text-primary)] font-black">₹{(intent.budget.max / 10000000).toFixed(1)} Cr</span> budget targeting <span className="text-[var(--primary)] font-black uppercase text-[10px] tracking-widest">{intent.purpose.replace('_', ' ')}</span>.
          </p>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-[var(--border-strong)] via-transparent to-transparent w-full" />
      </div>
    </div>
  );
}
