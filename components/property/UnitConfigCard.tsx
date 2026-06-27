'use client';

import { UnitConfig } from "@/types/project";
import { Project } from "@/types/project";
import { formatINR } from "@/lib/finance-calculations";
import { Maximize, Compass, ZoomIn, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UnitConfigCardProps {
  unit: UnitConfig;
  project: Project;
}

export default function UnitConfigCard({ unit, project }: UnitConfigCardProps) {
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);

  return (
    <>
      {/* Floor plan lightbox */}
      <AnimatePresence>
        {floorPlanOpen && unit.floorPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm
              flex items-center justify-center p-4"
            onClick={() => setFloorPlanOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-2xl w-full bg-white rounded-[var(--radius-lg)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div>
                  <p className="font-black text-[var(--text-primary)]">{unit.type} Floor Plan</p>
                  <p className="text-xs text-[var(--text-muted)]">{unit.area} sq.ft · {unit.facing?.join(', ')}</p>
                </div>
                <button onClick={() => setFloorPlanOpen(false)}
                  className="p-2 hover:bg-[var(--surface-raised)] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
              <div className="p-5 bg-[var(--surface-raised)]">
                <img
                  src={unit.floorPlan}
                  alt={`${unit.type} floor plan`}
                  className="w-full h-auto max-h-[500px] object-contain rounded-[var(--radius-xs)]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)]
        overflow-hidden flex flex-col shadow-[var(--shadow-sm)]">

        {/* Floor plan preview — shown if floorPlan URL exists */}
        {unit.floorPlan ? (
          <div className="relative h-40 bg-[var(--surface-raised)] overflow-hidden cursor-pointer group"
            onClick={() => setFloorPlanOpen(true)}>
            <img
              src={unit.floorPlan}
              alt={`${unit.type} floor plan`}
              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors
              flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity
                flex items-center gap-2 bg-white/90 text-[var(--text-primary)]
                px-3 py-1.5 rounded-full text-xs font-bold shadow">
                <ZoomIn className="w-3.5 h-3.5" />
                View Floor Plan
              </div>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-[var(--surface-raised)] flex flex-col items-center justify-center
            text-[var(--text-muted)] gap-2">
            <div className="w-10 h-10 bg-[var(--border)] rounded-lg flex items-center justify-center">
              <Maximize className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider">Floor Plan TBA</p>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4 flex-1">
          {/* Header: type + price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-black text-[var(--text-primary)]">{unit.type}</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{unit.area} sq.ft carpet area</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-black text-[var(--primary)]">{formatINR(unit.price)}</p>
              {unit.priceIsPlus && (
                <p className="text-[10px] text-[var(--text-muted)]">+</p>
              )}
              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                ~{formatINR(unit.pricePerSqFt)}{unit.priceIsPlus ? '+' : ''}/sqft
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[var(--surface-raised)] rounded-lg flex items-center justify-center">
                <Maximize className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Area</p>
                <p className="text-xs font-bold text-[var(--text-primary)]">{unit.area} sqft</p>
              </div>
            </div>
          </div>

          {/* Facing chips */}
          {unit.facing && unit.facing.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {unit.facing.map(f => (
                <span key={f}
                  className="px-2 py-0.5 bg-[var(--surface-raised)] border border-[var(--border)]
                    rounded-full text-[10px] font-semibold text-[var(--text-secondary)]">
                  {f} facing
                </span>
              ))}
            </div>
          )}

          {/* Highlights */}
          {unit.highlights && unit.highlights.length > 0 && (
            <div className="space-y-1">
              {unit.highlights.slice(0, 3).map(h => (
                <p key={h} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[var(--primary)] flex-shrink-0" />
                  {h}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
