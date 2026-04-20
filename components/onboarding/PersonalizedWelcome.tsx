'use client';

import { motion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import { UserIntent } from "@/types/user";
import { useEffect, useState } from "react";

export default function PersonalizedWelcome() {
  const [intent, setIntent] = useState<UserIntent | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('userIntent');
    if (saved) setIntent(JSON.parse(saved));
  }, []);

  if (!intent) return null;

  return (
    <div className="bg-[var(--primary-glow)] border-b border-[var(--primary)]/10 p-6 pt-12">
      <div className="max-w-md mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full"
        >
          <Sparkles className="w-3 h-3 text-[var(--primary)]" />
          <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">AI Tailored Feed</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Your Top Matches
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Based on your budget of <span className="text-[var(--text-primary)] font-semibold">₹{(intent.budget.max / 10000000).toFixed(1)} Cr</span> and focus on <span className="text-[var(--text-primary)] font-semibold">{intent.purpose.replace('_', ' ')}</span>.
          </p>
        </motion.div>

        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center pt-2"
        >
          <ArrowDown className="w-4 h-4 text-[var(--primary)]/40" />
        </motion.div>
      </div>
    </div>
  );
}
