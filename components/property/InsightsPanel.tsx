'use client';

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  pros: string[];
  cons: string[];
  variant: 'card' | 'detail' | 'compare';
}

export default function InsightsPanel({ pros, cons, variant }: InsightsPanelProps) {
  const displayCons = cons.length > 0 ? cons : ["Insufficient data for risk assessment"];

  if (variant === 'card') {
    return (
      <div className="flex flex-col gap-1.5">
        {pros.slice(0, 2).map((pro, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-[var(--success)] bg-[var(--success)]/5 px-2 py-1 rounded-[var(--radius-xs)] border border-[var(--success)]/10 w-full">
            <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full flex-shrink-0" />
            <span className="line-clamp-1">{pro}</span>
          </div>
        ))}
        {displayCons.slice(0, 1).map((con, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] text-[var(--danger)] bg-[var(--danger)]/5 px-2 py-1 rounded-[var(--radius-xs)] border border-[var(--danger)]/10 w-full">
            <div className="w-1.5 h-1.5 bg-[var(--danger)] rounded-full flex-shrink-0" />
            <span className="line-clamp-1">{con}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          What We Found
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--success)] uppercase tracking-wider">The Positives</p>
            <div className="space-y-2">
              {pros.map((pro, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 bg-[var(--success)]/5 border border-[var(--success)]/10 rounded-lg p-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">{pro}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--danger)] uppercase tracking-wider">Potential Risks</p>
            <div className="space-y-2">
              {displayCons.map((con, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 bg-[var(--danger)]/5 border border-[var(--danger)]/10 rounded-lg p-3"
                >
                  <AlertTriangle className="w-4 h-4 text-[var(--danger)] mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)]">{con}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compare') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {pros.slice(0, 3).map((pro, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
              <span className="line-clamp-1">{pro}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {displayCons.slice(0, 3).map((con, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)] shrink-0" />
              <span className="line-clamp-1">{con}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
