'use client';

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TrustScoreBadgeProps {
  score: number;
  size: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showBreakdown?: boolean;
  breakdown?: {
    builderScore: number;
    locationScore: number;
    priceFairness: number;
    reraCompliance: number;
    rentalPotential: number;
  };
}

export default function TrustScoreBadge({ 
  score, 
  size, 
  showLabel = false, 
  showBreakdown = false,
  breakdown 
}: TrustScoreBadgeProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  const dimensions = {
    sm: { size: 44, stroke: 3, fontSize: '12px' },
    md: { size: 64, stroke: 5, fontSize: '16px' },
    lg: { size: 96, stroke: 8, fontSize: '24px' }
  }[size];

  const radius = (dimensions.size - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass = score >= 75 ? 'text-[var(--success)]' : score >= 50 ? 'text-[var(--warning)]' : 'text-[var(--danger)]';
  const strokeColor = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dimensions.size, height: dimensions.size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={dimensions.stroke}
          />
          <motion.circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            fill="var(--surface)"
            stroke={strokeColor}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div 
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ 
            fontSize: dimensions.fontSize, 
            fontFamily: 'var(--font-display)',
            color: strokeColor
          }}
        >
          {score}
        </div>
      </div>

      {showLabel && (
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
          Trust Score
        </span>
      )}

      {showBreakdown && size === 'lg' && breakdown && (
        <div className="w-full max-w-[240px] space-y-3 pt-4">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-secondary)] uppercase">
                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                <span>{val}%</span>
              </div>
              <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${val}%` } : {}}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-[var(--primary)]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
