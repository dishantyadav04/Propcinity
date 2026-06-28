'use client';

import { Project, UnitConfig } from "@/types/project";
import PropertyFitBadge from "./PropertyFitBadge";
import InsightsPanel from "./InsightsPanel";
import WhyThisFitsYou from "./WhyThisFitsYou";
import ProjectImage from "./ProjectImage";
import { formatINR } from "@/lib/finance-calculations";
import { MapPin, ChevronRight, ShieldCheck, Plus, Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { addToCompare } from "@/lib/utils";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useRouter } from "next/navigation";

interface ProjectCardProps {
  project: Project;
  matchedUnit?: UnitConfig;
  index?: number;
  hideRiskBadge?: boolean;
  hideCuratedButton?: boolean;
  priority?: boolean;
}

export default function ProjectCard({
  project, matchedUnit, index = 0, hideCuratedButton, priority = false
}: ProjectCardProps) {
  const displayUnit = matchedUnit || project.unitConfigs[0];
  const minPrice = project.unitConfigs.length > 0
    ? Math.min(...project.unitConfigs.map(u => u.price))
    : 0;

  const { isGuest: isGuestRaw, isChecking } = useGuestMode();
  const isGuest = !isChecking && isGuestRaw;
  const router = useRouter();

  const [isComparing, setIsComparing] = useState(false);
  const [isCurated, setIsCurated] = useState(false);

  useEffect(() => {
    const checkCompare = () => {
      const current = storage.get<any[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
      setIsComparing(!!current.find(p => p.id === project.id));
    };
    const checkCurated = () => {
      const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
      setIsCurated(curated.includes(project.id));
    };
    checkCompare();
    checkCurated();
    window.addEventListener('compareUpdated', checkCompare);
    window.addEventListener('curatedUpdated', checkCurated);
    return () => {
      window.removeEventListener('compareUpdated', checkCompare);
      window.removeEventListener('curatedUpdated', checkCurated);
    };
  }, [project.id]);

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = storage.get<any[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
    const exists = current.find(p => p.id === project.id);
    if (!exists && current.length >= 5) {
      toast.error("You can compare maximum 5 projects");
      return;
    }
    addToCompare(project);
  };

  const toggleCurated = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const curated = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
    const exists = curated.includes(project.id);
    const updated = exists
      ? curated.filter((id: string) => id !== project.id)
      : [...curated, project.id];
    storage.set(STORAGE_KEYS.CURATED_IDS, updated);
    setIsCurated(!exists);
    window.dispatchEvent(new Event('curatedUpdated'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] card-hover overflow-hidden flex flex-col relative"
      style={{ minHeight: '360px' }}
    >
      {/* Dashboard + / ✓ button */}
      {!hideCuratedButton && (
        <button
          onClick={e => {
            if (isGuest) {
              toast('Sign up to save projects to your Dashboard', {
                action: { label: 'Get Started — Free', onClick: () => router.push('/onboarding') }
              });
              return;
            }
            toggleCurated(e);
          }}
          title={isCurated ? 'Remove from Dashboard' : 'Add to Dashboard'}
          className={`absolute top-3 right-3 z-30 w-7 h-7 rounded-full
            flex items-center justify-center
            transition-all duration-150 shadow-sm backdrop-blur-sm
            hover:scale-110 ${
              isCurated
                ? 'bg-[var(--primary)] text-white'
                : 'bg-black/40 text-white hover:bg-[var(--primary)]'
            }`}
        >
          {isCurated
            ? <Check className="w-3.5 h-3.5" />
            : <Plus className="w-3.5 h-3.5" />
          }
        </button>
      )}

      <Link href={`/projects/${project.slug}`} className="block flex flex-col flex-1 min-h-0">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-[var(--surface-raised)]">
          <div className="relative w-full h-48 group-hover:scale-105 transition-transform duration-500">
            <ProjectImage
              src={project.images?.[0] ?? ''}
              alt={project.name}
              priority={priority}
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

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

        {/* Match Badge — sits between image and body */}
        {displayUnit && (
          <div className="px-4 pt-3 pb-0">
            <PropertyFitBadge score={Math.min(100, Math.round((displayUnit.price / 100000) % 100))} />
          </div>
        )}

        {/* Body */}
        <div className="p-4 space-y-3 flex flex-col flex-1">
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
            {project.reraStatus === 'registered' && project.reraId && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--success)] font-bold">
                <ShieldCheck className="w-3 h-3" /> RERA Verified
              </span>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCompare}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                  isComparing ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                }`}
              >
                {isComparing ? 'Comparing' : '+ Compare'}
              </button>
              <span className="ml-auto flex items-center gap-1 text-[var(--primary)] text-xs font-bold">
                View Full Audit <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
