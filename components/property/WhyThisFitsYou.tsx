'use client';

import { Project, UnitConfig } from "@/types/project";
import { UserIntent } from "@/types/user";
import { generateFitReasons } from "@/services/fit-analysis";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

interface WhyThisFitsYouProps {
  project: Project;
  matchedUnit?: UnitConfig;
  variant: 'card' | 'detail';
}

export default function WhyThisFitsYou({ project, matchedUnit, variant }: WhyThisFitsYouProps) {
  const [intent, setIntent] = useState<UserIntent | null>(null);

  useEffect(() => {
    const savedIntent = localStorage.getItem("userIntent");
    if (savedIntent) {
      try {
        setIntent(JSON.parse(savedIntent));
      } catch (e) {
        console.error("Failed to parse user intent", e);
      }
    }
  }, []);

  if (!intent) return null;

  const analysis = generateFitReasons(project, matchedUnit || null, intent);

  if (variant === 'card') {
    return (
      <div className="text-[10px] text-[var(--text-muted)] font-medium">
        🎯 {analysis.headline}
      </div>
    );
  }

  return (
    <div className="bg-[var(--primary-glow)] border border-[var(--primary)]/20 rounded-[var(--radius)] p-5 space-y-4">
      <h3 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
        Why This Fits You
      </h3>
      
      <p className="text-[var(--text-primary)] font-semibold text-sm">
        {analysis.headline}
      </p>

      <div className="space-y-3">
        {analysis.reasons.map((reason, i) => {
          const Icon = (LucideIcons as any)[reason.icon] || LucideIcons.Target;
          const colorClass = 
            reason.strength === 'strong' ? 'text-[var(--success)]' : 
            reason.strength === 'moderate' ? 'text-[var(--warning)]' : 
            'text-[var(--text-muted)]';

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={cn("p-1.5 rounded-full bg-white/5", colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">{reason.text}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
