'use client';

import { Project, UnitConfig } from "@/types/project";
import TrustScoreBadge from "./TrustScoreBadge";
import PropertyFitBadge from "./PropertyFitBadge";
import InsightsPanel from "./InsightsPanel";
import WhyThisFitsYou from "./WhyThisFitsYou";
import FreeBuyerBadge from "@/components/trust/FreeBuyerBadge";
import { formatINR } from "@/lib/finance-calculations";
import { MapPin, Building, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProjectCardProps {
  project: Project;
  matchedUnit?: UnitConfig;
  fitScore?: number;
}

export default function ProjectCard({ project, matchedUnit, fitScore }: ProjectCardProps) {
  const displayUnit = matchedUnit || project.unitConfigs[0];
  const minPrice = Math.min(...project.unitConfigs.map(u => u.priceMin));
  const maxPrice = Math.max(...project.unitConfigs.map(u => u.priceMin));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-xl hover:border-[var(--primary)]/30 transition-all active:scale-[0.98]"
    >
      <Link href={`/projects/${project.slug}`} className="block">
        {/* Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img 
            src={project.images[0]} 
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <FreeBuyerBadge variant="pill" />
            {fitScore && <PropertyFitBadge score={fitScore} />}
          </div>

          <div className="absolute top-3 right-3">
            <TrustScoreBadge score={project.trustScore} size="sm" showLabel />
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
              {project.name}
            </h3>
            <div className="flex items-center gap-1.5 text-white/80 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{project.location}, {project.city}</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Starts from</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {formatINR(minPrice)} <span className="text-xs text-[var(--text-muted)] font-normal">onwards</span>
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Configuration</p>
              <p className="text-sm font-bold text-[var(--text-secondary)]">
                {Array.from(new Set(project.unitConfigs.map(u => u.type.split(' ')[0]))).join(', ')}
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--border)] w-full" />

          {/* Fit Reasons (Personalized) */}
          <WhyThisFitsYou project={project} matchedUnit={displayUnit} variant="card" />

          {/* Insights */}
          <InsightsPanel pros={project.pros} cons={project.cons} variant="card" />

          <div className="pt-2 flex items-center justify-between text-[var(--primary)]">
            <span className="text-xs font-bold uppercase tracking-widest">View Detailed Audit</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
