'use client';

import { Project, UnitConfig } from "@/types/project";
import TrustScoreBadge from "./TrustScoreBadge";
import InsightsPanel from "./InsightsPanel";
import WhyThisFitsYou from "./WhyThisFitsYou";
import { formatINR } from "@/lib/finance-calculations";
import { MapPin, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserIntent } from "@/types/user";

interface ProjectCardProps {
  project: Project;
  matchedUnit?: UnitConfig;
  fitScore?: number;
  index?: number;
}

export default function ProjectCard({ project, matchedUnit, fitScore, index = 0 }: ProjectCardProps) {
  const displayUnit = matchedUnit || project.unitConfigs[0];
  const minPrice = project.unitConfigs.length > 0
    ? Math.min(...project.unitConfigs.map(u => u.priceMin))
    : 0;

  const riskColors = {
    low: { bg: 'var(--success-light)', text: 'var(--success)', label: 'Low Risk' },
    medium: { bg: 'var(--warning-light)', text: 'var(--warning)', label: 'Med Risk' },
    high: { bg: 'var(--danger-light)', text: 'var(--danger)', label: 'High Risk' },
  };
  const risk = riskColors[project.riskLabel] || riskColors.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] card-hover overflow-hidden"
    >
      <Link href={`/projects/${project.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-raised)]">
          {project.images?.[0] ? (
            <img
              src={project.images[0]}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-sm">No image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span style={{ background: risk.bg, color: risk.text }}
              className="px-2 py-1 text-[10px] font-bold rounded-full">{risk.label}</span>
            {fitScore && fitScore >= 60 && (
              <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                {Math.round(fitScore)}% match
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <TrustScoreBadge score={project.trustScore} size="sm" />
          </div>

          {/* Bottom name */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-lg font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>{project.name}</h3>
            <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{project.location}, {project.city}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Price + config row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-0.5">Starting from</p>
              <p className="text-xl font-black text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-display)' }}>{formatINR(minPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-0.5">Configuration</p>
              <div className="flex flex-wrap gap-1 justify-end">
                {Array.from(new Set(project.unitConfigs.map(u => u.type))).slice(0, 3).map(type => (
                  <span key={type} className="px-2 py-0.5 bg-[var(--surface-raised)] text-[var(--text-secondary)] text-xs font-semibold rounded-full border border-[var(--border)]">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* Why this fits */}
          <WhyThisFitsYou project={project} matchedUnit={displayUnit} variant="card" />

          {/* Pros + cons */}
          <InsightsPanel pros={project.pros} cons={project.cons} variant="card" />

          {/* RERA badge + CTA */}
          <div className="flex items-center justify-between pt-1">
            {project.reraId && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--success)] font-bold">
                <ShieldCheck className="w-3 h-3" /> RERA Verified
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 text-[var(--primary)] text-xs font-bold">
              View Full Audit <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
