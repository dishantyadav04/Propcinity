'use client';

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Project, UnitConfig } from "@/types/project";
import { UserIntent } from "@/types/user";
import { formatINR } from "@/lib/finance-calculations";
import { getMatchedUnitsForBhk, getRepresentativeUnit } from "@/lib/matched-units";
import { scoreMatchedUnit } from "@/lib/match-score";
import { isLocationMatch } from "@/services/fit-analysis";
import { CheckCircle2, XCircle, ArrowLeft, Plus, Loader2, Minus, Lock, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import { GUEST_LIMITS } from "@/lib/guest-config";
import GuestGate from "@/components/ui/GuestGate";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { createResourceCache } from "@/lib/client-cache";

// Same cache name/instance as app/dashboard/page.tsx — if the dashboard has
// already fetched the full project list in this session, compare reuses it
// instead of re-fetching from the network.
const projectsCache = createResourceCache<Project[]>('projects:all', 60 * 1000);

function CompareContent() {
  const router = useRouter();
  const { isGuest: isGuestRaw, isChecking } = useGuestMode();
  const isGuest = !isChecking && isGuestRaw;
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const idsParam = searchParams?.get('ids');

  // Saved onboarding intent — null for guests / users who skipped onboarding.
  // When null, the table falls back to today's generic behavior unchanged.
  const [intent, setIntent] = useState<UserIntent | null>(null);
  useEffect(() => {
    setIntent(storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null));
  }, []);

  // Tracks the user's Keep/Remove choice for a project that's missing one of
  // their selected BHK types — asked once per project per session, per PRD §4.3.
  const [missingConfigChoice, setMissingConfigChoice] = useState<Record<string, 'keep' | 'pending'>>({});

  useEffect(() => {
    const stored = storage.get<Project[]>(STORAGE_KEYS.COMPARE_ITEMS, []);

    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      const fromStore = stored.filter(p => ids.includes(p.id));

      if (fromStore.length === ids.length) {
        setProjects(fromStore);
        setIsLoading(false);
        return;
      }

      const cachedAll = projectsCache.get();
      if (cachedAll) {
        setProjects(cachedAll.filter(p => ids.includes(p.id)));
        setIsLoading(false);
        return;
      }

      fetch('/api/projects')
        .then(r => r.json())
        .then((all: Project[]) => {
          projectsCache.set(all);
          setProjects(all.filter(p => ids.includes(p.id)));
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
      return;
    }

    if (stored.length > 0) {
      setProjects(stored);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [idsParam]);

  // ── Horizontal scroll: refs, drag-to-scroll, and arrow-button state ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [projects]);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const removeProject = (id: string) => {
    const stored = storage.get<Project[]>(STORAGE_KEYS.COMPARE_ITEMS, []);
    storage.set(STORAGE_KEYS.COMPARE_ITEMS, stored.filter(p => p.id !== id));
    setProjects(prev => prev.filter(p => p.id !== id));
    window.dispatchEvent(new Event('compareUpdated'));
    toast('Removed from compare');
  };

  const removeProjectFromCompare = (id: string) => {
    removeProject(id);
  };

  const keepDespiteMissingConfig = (id: string) => {
    setMissingConfigChoice(prev => ({ ...prev, [id]: 'keep' }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragStartScrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!isDraggingRef.current || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.3;
    el.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const allAmenities = useMemo(() => {
    const s = new Set<string>();
    projects.forEach(p => (p.amenities || []).forEach(a => s.add(a)));
    return Array.from(s).sort();
  }, [projects]);

  const pageHero = (
    <div className="sr-only md:not-sr-only border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-5">
        <h1
          className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Compare properties side by side
          <span className="text-[var(--primary)]"> — Match %, price, and RERA status in one view</span>
        </h1>
        <p className="mt-2 text-sm sm:text-[15px] text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          See how your shortlisted Pune properties stack up on Match % score, pricing,
          RERA verification, construction progress, amenities, and more — all in a
          single, clean comparison table.
        </p>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  if (projects.length === 0) return (
    <div className="min-h-screen bg-[var(--background)]">
      {pageHero}
      <div className="flex flex-col items-center justify-center gap-5 p-6 py-20 text-center">
        <div className="text-5xl">⚖️</div>
        <h2 className="text-2xl font-black text-[var(--text-primary)]">Nothing to compare</h2>
        <p className="text-[var(--text-secondary)] max-w-sm">
          Add projects to compare using the compare bar at the bottom of any page.
        </p>
        <Link href="/explore"
          className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]">
          <Plus className="w-4 h-4" /> Browse Projects
        </Link>
      </div>
    </div>
  );

  const selectedBhks = intent?.bhkType?.length ? intent.bhkType : [];
  const hasIntent = !!intent;

  // Per-BHK sub-rows, only built when the user has selected BHK preferences.
  const bhkRows: { label: string; render: (p: Project) => React.ReactNode }[] = selectedBhks.map(bhk => ({
    label: `${bhk} (matched unit)`,
    render: (p: Project) => {
      const unit = getRepresentativeUnit(p, bhk);
      if (!unit) {
        const choice = missingConfigChoice[p.id];
        if (choice === 'keep') {
          return <span className="text-xs text-[var(--text-muted)]">Not available (kept anyway)</span>;
        }
        return (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-amber-600">Not available in this config</span>
            <div className="flex gap-1.5">
              <button onClick={() => keepDespiteMissingConfig(p.id)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border)] hover:bg-[var(--surface-raised)]">
                Keep
              </button>
              <button onClick={() => removeProjectFromCompare(p.id)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                Remove
              </button>
            </div>
          </div>
        );
      }
      const { budgetFit } = intent ? scoreMatchedUnit(p, unit, intent) : { budgetFit: 'within' as const };
      const budgetLabel = budgetFit === 'under' ? 'Under budget' : budgetFit === 'over' ? 'Above budget' : 'Within budget';
      const budgetColor = budgetFit === 'over' ? 'text-amber-600' : 'text-[var(--success)]';
      return (
        <div className="space-y-0.5">
          <p className="font-black text-[var(--primary)] text-sm">{formatINR(unit.price)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{unit.area} sqft</p>
          <p className={`text-[10px] font-bold ${budgetColor}`}>{budgetLabel}</p>
        </div>
      );
    },
  }));

  const rows: { label: string; render: (p: Project) => React.ReactNode }[] = [
    ...(hasIntent ? [{
      label: 'Fit Score',
      render: (p: Project) => {
        const unit = selectedBhks.length ? getRepresentativeUnit(p, selectedBhks[0]) : p.unitConfigs?.[0];
        if (!unit || !intent) return <span className="text-xs text-[var(--text-muted)]">—</span>;
        const { percent } = scoreMatchedUnit(p, unit, intent);
        return <span className="font-black text-[var(--primary)]">{percent}%</span>;
      },
    }] : []),
    ...bhkRows,
    ...(!selectedBhks.length ? [{
      label: 'Price From', render: (p: Project) => (
        <span className="font-black text-[var(--primary)]">
          {p.unitConfigs?.length ? formatINR(Math.min(...(p.unitConfigs || []).map(u => u.price))) : '—'}
        </span>
      )
    }, {
      label: 'Config', render: (p: Project) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {Array.from(new Set((p.unitConfigs || []).map(u => u.type || 'Unit'))).join(', ') || '—'}
        </span>
      )
    }] : []),
    ...(hasIntent ? [{
      label: 'Location Match',
      render: (p: Project) => intent && isLocationMatch(p, intent)
        ? <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
        : <XCircle className="w-5 h-5 text-[var(--text-muted)]" />,
    }] : []),
    ...(hasIntent && intent!.preferences?.length ? [{
      label: 'Your Preferences',
      render: (p: Project) => (
        <div className="flex flex-wrap gap-1 justify-center max-w-[160px]">
          {intent!.preferences.map(pref => (
            <span key={pref} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              (p.amenities || []).includes(pref)
                ? 'bg-[var(--success)]/10 text-[var(--success)]'
                : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
            }`}>
              {pref}
            </span>
          ))}
        </div>
      ),
    }] : []),
    { label: 'Builder', render: p => <span className="text-sm font-semibold">{p.builderName || '—'}</span> },
    {
      label: 'RERA Status', render: p => {
        switch (p.reraStatus) {
          case 'registered': return <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />;
          case 'expired': return <XCircle className="w-5 h-5 text-[var(--danger)]" />;
          case 'pending': return <span className="text-xs text-amber-500 font-bold">Pending</span>;
          default: return <XCircle className="w-5 h-5 text-[var(--text-muted)]" />;
        }
      }
    },
    { label: 'Possession', render: p => <span className="text-xs">{p.possessionDate || '—'}</span> },
    {
      label: 'Construction', render: p => (
        <div className="space-y-1 w-24">
          <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--primary)] rounded-full"
              style={{ width: `${p.constructionPercent || 0}%` }} />
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">{p.constructionPercent || 0}%</span>
        </div>
      )
    },
    ...allAmenities.map(amenity => ({
      label: amenity,
      render: (p: Project) => (p.amenities || []).includes(amenity)
        ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
        : <Minus className="w-4 h-4 text-[var(--border-strong)]" />,
    })),
  ];

  const freeRows = isGuest ? rows.slice(0, GUEST_LIMITS.compare.visibleRows) : rows;
  const lockedRows = isGuest ? rows.slice(GUEST_LIMITS.compare.visibleRows) : [];

  const viewDetailsLink = (p: Project) => {
    if (isGuest) {
      return (
        <button
          onClick={() => toast('Sign up to view full project details', {
            action: { label: 'Get Started', onClick: () => router.push('/onboarding') }
          })}
          className="inline-block text-[10px] font-black text-[var(--primary)]"
        >
          View Details →
        </button>
      );
    }
    return (
      <Link href={`/projects/${p.slug}`} className="inline-block text-[10px] font-black text-[var(--primary)]">
        View Details →
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-40">
      {pageHero}
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/explore"
            className="p-2 hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Link>
          <h2 className="font-black text-[var(--text-primary)] text-lg flex-1"
            style={{ fontFamily: 'var(--font-display)' }}>
            Comparing {projects.length} Project{projects.length !== 1 ? 's' : ''}
          </h2>
          <Link href="/explore"
            className="text-xs font-bold text-[var(--primary)] flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add More
          </Link>
        </div>
      </div>

      {/* ── Comparison table (one responsive, swipeable table for all screen sizes) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {projects.length > 2 && (
          <p className="sm:hidden flex items-center justify-center gap-1 text-[10px] font-bold
            text-[var(--text-muted)] mb-2">
            <ChevronLeft className="w-3 h-3" /> Swipe to compare all {projects.length} <ChevronRight className="w-3 h-3" />
          </p>
        )}

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scrollByAmount(-240)}
              aria-label="Scroll left"
              className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center
                w-8 h-8 rounded-full bg-white border border-[var(--border)] shadow-[var(--shadow-sm)]
                hover:bg-[var(--surface-raised)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollByAmount(240)}
              aria-label="Scroll right"
              className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 items-center justify-center
                w-8 h-8 rounded-full bg-white border border-[var(--border)] shadow-[var(--shadow-sm)]
                hover:bg-[var(--surface-raised)] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            style={{ WebkitOverflowScrolling: 'touch' }}
            className="overflow-x-auto pb-2 select-none cursor-grab active:cursor-grabbing
              [&::-webkit-scrollbar]:h-2.5
              [&::-webkit-scrollbar-track]:bg-[var(--surface-raised)]
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[var(--border-strong)]
              [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <table
              className="border-collapse"
              style={{ minWidth: `${projects.length * 150 + 112}px` }}
            >
              <thead>
                <tr>
                  <th className="w-28 sm:w-36 p-2 sm:p-3 text-left text-[10px] font-black text-[var(--text-muted)]
                    uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border)]
                    sticky left-0 z-10">
                    Feature
                  </th>
                  {projects.map(p => (
                    <th key={p.id} className="p-2 sm:p-3 bg-white border border-[var(--border)] min-w-[150px] sm:min-w-[180px] relative">
                      <button
                        onClick={() => removeProject(p.id)}
                        aria-label={`Remove ${p.name} from comparison`}
                        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full
                          bg-[var(--surface-raised)] hover:bg-[var(--danger-light)]
                          text-[var(--text-muted)] hover:text-[var(--danger)]
                          flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="space-y-2 text-center">
                        {p.images?.[0] && (
                          <div className="relative w-full h-16 sm:h-24">
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              draggable={false}
                              className="object-cover rounded-[var(--radius-xs)] pointer-events-none"
                              sizes="180px"
                            />
                          </div>
                        )}
                        <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] line-clamp-2">{p.name}</p>
                        <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">{p.location}</p>
                        {viewDetailsLink(p)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {freeRows.map((row, i) => {
                  const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]';
                  return (
                    <tr key={row.label} className={rowBg}>
                      <td className={`p-2 sm:p-3 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] border border-[var(--border)]
                        uppercase tracking-wider sticky left-0 z-10 whitespace-nowrap ${rowBg}`}>
                        {row.label}
                      </td>
                      {projects.map(p => (
                        <td key={p.id} className="p-2 sm:p-3 text-center border border-[var(--border)]">
                          <div className="flex items-center justify-center">{row.render(p)}</div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {lockedRows.length > 0 && (
                  <tr>
                    <td colSpan={projects.length + 1} className="p-0">
                      <GuestGate
                        isGuest={true}
                        label={`${lockedRows.length} more comparison rows — sign up to unlock`}
                        blur={true}
                      >
                        <table className="w-full border-collapse pointer-events-none">
                          <tbody>
                            {lockedRows.map((row, i) => {
                              const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]';
                              return (
                                <tr key={row.label} className={rowBg}>
                                  <td className={`p-2 sm:p-3 text-[10px] sm:text-xs font-bold text-[var(--text-muted)] border border-[var(--border)]
                                    w-28 sm:w-36 uppercase tracking-wider whitespace-nowrap ${rowBg}`}>
                                    {row.label}
                                  </td>
                                  {projects.map(p => (
                                    <td key={p.id} className="p-2 sm:p-3 text-center border border-[var(--border)]">
                                      <div className="flex items-center justify-center">{row.render(p)}</div>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </GuestGate>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
