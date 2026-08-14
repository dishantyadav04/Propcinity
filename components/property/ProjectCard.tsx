'use client';

import { Project, UnitConfig } from "@/types/project";
import PropertyFitBadge from "./PropertyFitBadge";
import InsightsPanel from "./InsightsPanel";
import WhyThisFitsYou from "./WhyThisFitsYou";
import ProjectImage from "./ProjectImage";
import { formatINR } from "@/lib/finance-calculations";
import { MapPin, ChevronRight, ShieldCheck, Plus, Check, Building2 } from "lucide-react";
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
  matchScore?: number;
  isComparing?: boolean;
  onCompare?: () => void;
}

function ConfigTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-3.5 h-3.5 rounded-full bg-[var(--surface-raised)] border-0 text-[9px] font-bold text-[var(--text-muted)] flex items-center justify-center cursor-pointer hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="What does configuration mean?"
      >
        ?
      </button>
      {open && (
        <div className="absolute right-0 top-5 w-44 bg-[var(--text-primary)] text-[var(--background)] text-[10.5px] leading-relaxed px-2.5 py-2 rounded-xl z-50 pointer-events-none shadow-lg">
          Unit types available in this project — each with different sizes and price ranges.
          <div className="absolute -top-1 right-1.5 w-2 h-2 bg-[var(--text-primary)] rotate-45 rounded-[1px]" />
        </div>
      )}
    </div>
  );
}

export default function ProjectCard({
  project, matchedUnit, index = 0, hideCuratedButton, priority = false, matchScore, isComparing: isComparingProp, onCompare
}: ProjectCardProps) {
  const displayUnit = matchedUnit || project.unitConfigs[0];
  const minPrice = project.unitConfigs.length > 0
    ? Math.min(...project.unitConfigs.map(u => u.price))
    : 0;

  const { isGuest: isGuestRaw, isChecking } = useGuestMode();
  const isGuest = !isChecking && isGuestRaw;
  const router = useRouter();

  const [isComparing, setIsComparing] = useState(isComparingProp ?? false);
  const [isCurated, setIsCurated] = useState(false);

  const unitTypes = Array.from(new Set(project.unitConfigs.map(u => u.type || 'Unit')));

  const shortLabel = (type: string) => {
    const match = type.match(/(\d+\s*BHK)/i);
    return match ? match[1].replace(/\s+/, '') : type.split(' ')[0];
  };

  const MAX_VISIBLE_CONFIGS = 3;
  const visibleTypes = unitTypes.slice(0, MAX_VISIBLE_CONFIGS);
  const hiddenCount = unitTypes.length - MAX_VISIBLE_CONFIGS;

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
    if (onCompare) {
      onCompare();
      return;
    }
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
            hover:scale-110 ${isCurated
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

      {/* Image section */}
      <Link href={`/projects/${project.slug}`} className="block">
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

          {/* RERA Verified badge — top-left overlay */}
          {project.reraStatus === 'registered' && (
            <div className="absolute top-2.5 left-2.5 z-10 group/rera">
              <div className="flex items-center justify-center w-6 h-6 rounded-full backdrop-blur-sm cursor-default"
                style={{ background: 'rgba(22,163,74,0.22)', border: '1px solid rgba(22,163,74,0.4)' }}>
                <ShieldCheck className="w-3.5 h-3.5 text-green-300" />
              </div>
              {/* Tooltip */}
              <div className="absolute top-8 left-0 whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-bold
                bg-[var(--text-primary)] text-[var(--background)] shadow-lg pointer-events-none
                opacity-0 group-hover/rera:opacity-100 transition-opacity duration-150 z-50">
                RERA Verified
                <div className="absolute -top-1 left-2 w-2 h-2 bg-[var(--text-primary)] rotate-45 rounded-[1px]" />
              </div>
            </div>
          )}

          {/* Project name + location at bottom */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-lg font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}>{project.name}</h3>
            <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{project.location}, {project.city}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Match + Builder row */}
      {typeof matchScore === 'number' && matchScore >= 0 && (
        <div className="flex items-center justify-between px-4 pt-3">
          <PropertyFitBadge score={matchScore} />
          {project.builderName && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center shrink-0">
                <Building2 className="w-2.5 h-2.5 text-[var(--text-muted)]" />
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-medium truncate max-w-[110px]">
                {project.builderName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="px-4 pb-4 pt-3 flex flex-col flex-1 space-y-3">
        {/* Price + Config row */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">
              Starting from
            </p>
            <p className="text-[26px] font-black text-[var(--text-primary)] tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
              {formatINR(minPrice)}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end mb-0.5">
              <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
                Configurations
              </span>
              <ConfigTooltip />
            </div>
            <div className="flex items-center gap-1 justify-end flex-wrap">
              {visibleTypes.map(type => (
                <span
                  key={type}
                  className="px-2 py-0.5 rounded-md border border-[var(--border)] text-[10px] font-bold tracking-wide text-[var(--text-secondary)] bg-transparent"
                >
                  {shortLabel(type)}
                </span>
              ))}
              {hiddenCount > 0 && (
                <Link
                  href={`/projects/${project.slug}`}
                  onClick={e => e.stopPropagation()}
                  className="px-2 py-0.5 rounded-md border border-[var(--primary)]/30 text-[10px] font-bold text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                >
                  +{hiddenCount}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)]" />

        {/* Why this fits */}
        <WhyThisFitsYou project={project} matchedUnit={displayUnit} variant="card" />

        {/* Pros + cons */}
        <InsightsPanel pros={project.pros} cons={project.cons} variant="card" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            onClick={handleCompare}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold
              border transition-all duration-150 cursor-pointer
              ${isComparing
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-transparent text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary-light)]'
              }`}
          >
            {isComparing ? '✓ Comparing' : '+ Compare'}
          </button>

          <Link
            href={`/projects/${project.slug}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold
              bg-[var(--primary)] text-white border border-[var(--primary)]
              hover:opacity-90 transition-opacity"
          >
            View Full Audit
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
