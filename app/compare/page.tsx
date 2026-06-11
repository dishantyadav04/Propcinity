'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Project } from "@/types/project";
import { formatINR } from "@/lib/finance-calculations";
import { CheckCircle2, XCircle, ArrowLeft, Plus, Loader2, Minus, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useGuestMode } from "@/hooks/useGuestMode";
import { GUEST_LIMITS } from "@/lib/guest-config";
import GuestGate from "@/components/ui/GuestGate";
import { storage, STORAGE_KEYS } from "@/lib/storage";

function CompareContent() {
  const router = useRouter();
  const { isGuest: isGuestRaw, isChecking } = useGuestMode();
  const isGuest = !isChecking && isGuestRaw;
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const idsParam = searchParams?.get('ids');

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

      fetch('/api/projects')
        .then(r => r.json())
        .then((all: Project[]) => setProjects(all.filter(p => ids.includes(p.id))))
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

  const allAmenities = useMemo(() => {
    const s = new Set<string>();
    projects.forEach(p => (p.amenities || []).forEach(a => s.add(a)));
    return Array.from(s).sort();
  }, [projects]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  if (projects.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center">
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
  );

  const rows: { label: string; render: (p: Project) => React.ReactNode }[] = [
    {
      label: 'Price From', render: p => (
        <span className="font-black text-[var(--primary)]">
          {p.unitConfigs?.length ? formatINR(Math.min(...(p.unitConfigs || []).map(u => u.priceMin))) : '—'}
        </span>
      )
    },
    {
      label: 'Config', render: p => (
        <span className="text-xs text-[var(--text-secondary)]">
          {Array.from(new Set((p.unitConfigs || []).map(u => u.type))).join(', ') || '—'}
        </span>
      )
    },
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
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/explore"
            className="p-2 hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Link>
          <h1 className="font-black text-[var(--text-primary)] text-lg flex-1"
            style={{ fontFamily: 'var(--font-display)' }}>
            Comparing {projects.length} Project{projects.length !== 1 ? 's' : ''}
          </h1>
          <Link href="/explore"
            className="text-xs font-bold text-[var(--primary)] flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add More
          </Link>
        </div>
      </div>

      {/* ── MOBILE: stacked attribute cards ──────────────── */}
      <div className="sm:hidden px-4 py-6 space-y-4">
        {/* Project header cards */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${projects.length}, 1fr)` }}>
          {projects.map(p => (
            <div key={p.id}
              className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)] block">
              {p.images?.[0] && (
                <div className="relative w-full h-20">
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="200px" />
                </div>
              )}
              <div className="p-2 text-center">
                <p className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-[9px] text-[var(--primary)] font-black mt-0.5">
                  {p.unitConfigs?.length ? formatINR(Math.min(...(p.unitConfigs || []).map(u => u.priceMin))) : '—'}
                </p>
                {viewDetailsLink(p)}
              </div>
            </div>
          ))}
        </div>

        {/* Attribute rows as cards — free rows */}
        {freeRows.map(row => (
          <div key={row.label}
            className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="px-4 py-2 bg-[var(--surface-raised)] border-b border-[var(--border)]">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                {row.label}
              </p>
            </div>
            <div className="grid divide-x divide-[var(--border)]"
              style={{ gridTemplateColumns: `repeat(${projects.length}, 1fr)` }}>
              {projects.map(p => (
                <div key={p.id} className="p-3 flex flex-col items-center gap-1 text-center">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] truncate w-full text-center">
                    {p.name.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <div className="flex justify-center">{row.render(p)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Locked rows in GuestGate */}
        {lockedRows.length > 0 && (
          <GuestGate
            isGuest={true}
            label={`${lockedRows.length} more comparison rows — sign up to unlock`}
            blur={true}
          >
            {lockedRows.map(row => (
              <div key={row.label}
                className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="px-4 py-2 bg-[var(--surface-raised)] border-b border-[var(--border)]">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                    {row.label}
                  </p>
                </div>
                <div className="grid divide-x divide-[var(--border)]"
                  style={{ gridTemplateColumns: `repeat(${projects.length}, 1fr)` }}>
                  {projects.map(p => (
                    <div key={p.id} className="p-3 flex flex-col items-center gap-1 text-center">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] truncate w-full text-center">
                        {p.name.split(' ').slice(0, 2).join(' ')}
                      </p>
                      <div className="flex justify-center">{row.render(p)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </GuestGate>
        )}
      </div>

      {/* ── DESKTOP: standard table ───────────────────────── */}
      <div className="hidden sm:block max-w-5xl mx-auto px-4 sm:px-6 py-6 overflow-x-auto">
        <table className="w-full border-collapse"
          style={{ minWidth: `${projects.length * 200 + 160}px` }}>
          <thead>
            <tr>
              <th className="w-36 p-3 text-left text-[10px] font-black text-[var(--text-muted)]
                uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border)]
                sticky left-0 z-10">
                Feature
              </th>
              {projects.map(p => (
                <th key={p.id} className="p-3 bg-[var(--surface)] border border-[var(--border)] min-w-[180px]">
                  <div className="space-y-2 text-center">
                    {p.images?.[0] && (
                      <div className="relative w-full h-24">
                        <Image src={p.images[0]} alt={p.name} fill className="object-cover rounded-[var(--radius-xs)]" sizes="180px" />
                      </div>
                    )}
                    <p className="font-bold text-sm text-[var(--text-primary)] line-clamp-2">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{p.location}</p>
                    {viewDetailsLink(p)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {freeRows.map((row, i) => (
              <tr key={row.label}
                className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--surface-raised)]/40'}>
                <td className="p-3 text-xs font-bold text-[var(--text-muted)] border border-[var(--border)]
                  uppercase tracking-wider sticky left-0 bg-inherit z-10 whitespace-nowrap">
                  {row.label}
                </td>
                {projects.map(p => (
                  <td key={p.id} className="p-3 text-center border border-[var(--border)]">
                    <div className="flex items-center justify-center">{row.render(p)}</div>
                  </td>
                ))}
              </tr>
            ))}
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
                        {lockedRows.map((row, i) => (
                          <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--surface-raised)]/40'}>
                            <td className="p-3 text-xs font-bold text-[var(--text-muted)] border border-[var(--border)] w-36 uppercase tracking-wider whitespace-nowrap">
                              {row.label}
                            </td>
                            {projects.map(p => (
                              <td key={p.id} className="p-3 text-center border border-[var(--border)]">
                                <div className="flex items-center justify-center">{row.render(p)}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
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
