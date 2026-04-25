'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Project } from "@/types/project";
import TrustScoreBadge from "@/components/property/TrustScoreBadge";
import { formatINR } from "@/lib/finance-calculations";
import { CheckCircle2, XCircle, ArrowLeft, Plus, Loader2, Minus } from "lucide-react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";

function CompareContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const idsParam = searchParams?.get('ids');

  useEffect(() => {
    // First: try to get from localStorage (already full objects)
    const stored: Project[] = JSON.parse(
      localStorage.getItem('compareItems') || '[]'
    );

    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      const fromStore = stored.filter(p => ids.includes(p.id));

      if (fromStore.length > 0) {
        setProjects(fromStore);
        setIsLoading(false);
        return;
      }
    }

    // Fallback: fetch all projects and filter
    if (stored.length > 0) {
      setProjects(stored);
      setIsLoading(false);
      return;
    }

    // Last resort: fetch from API
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      fetch('/api/projects')
        .then(r => r.json())
        .then((all: Project[]) =>
          setProjects(all.filter(p => ids.includes(p.id)))
        )
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
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
    { label: 'Trust Score', render: p => <TrustScoreBadge score={p.trustScore} size="sm" /> },
    { label: 'Risk', render: p => (
      <span className={`px-2 py-0.5 text-xs font-bold rounded-full capitalize ${
        p.riskLabel === 'low' ? 'bg-[var(--success-light)] text-[var(--success)]' :
        p.riskLabel === 'medium' ? 'bg-[var(--warning-light)] text-[var(--warning)]' :
        'bg-[var(--danger-light)] text-[var(--danger)]'}`}>{p.riskLabel}</span>
    )},
    { label: 'Price From', render: p => (
      <span className="font-black text-[var(--primary)]">
        {p.unitConfigs?.length ? formatINR(Math.min(...(p.unitConfigs || []).map(u => u.priceMin))) : '—'}
      </span>
    )},
    { label: 'Config', render: p => (
      <span className="text-xs text-[var(--text-secondary)]">
        {Array.from(new Set((p.unitConfigs || []).map(u => u.type))).join(', ') || '—'}
      </span>
    )},
    { label: 'Builder', render: p => <span className="text-sm font-semibold">{p.builderName || '—'}</span> },
    { label: 'RERA', render: p => p.reraId
      ? <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
      : <XCircle className="w-5 h-5 text-[var(--text-muted)]" /> },
    { label: 'Possession', render: p => <span className="text-xs">{p.possessionDate || '—'}</span> },
    { label: 'Construction', render: p => (
      <div className="space-y-1 w-24">
        <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--primary)] rounded-full"
            style={{ width: `${p.constructionPercent || 0}%` }} />
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">{p.constructionPercent || 0}%</span>
      </div>
    )},
    ...allAmenities.map(amenity => ({
      label: amenity,
      render: (p: Project) => (p.amenities || []).includes(amenity)
        ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
        : <Minus className="w-4 h-4 text-[var(--border-strong)]" />,
    })),
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-40">
      {/* Sticky header */}
      <div className="bg-white border-b border-[var(--border)] sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
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

      {/* Table */}
      <div className="max-w-6xl mx-auto px-2 sm:px-6 py-6 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${projects.length * 200 + 160}px` }}>
          <thead>
            <tr>
              <th className="w-36 p-3 text-left text-[10px] font-black text-[var(--text-muted)]
                uppercase tracking-wider bg-[var(--surface-raised)] border border-[var(--border)] sticky left-0 z-10">
                Feature
              </th>
              {projects.map(p => (
                <th key={p.id} className="p-3 bg-[var(--surface)] border border-[var(--border)] min-w-[180px]">
                  <div className="space-y-2 text-center">
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt={p.name}
                        className="w-full h-24 object-cover rounded-[var(--radius-xs)]" />
                    )}
                    <p className="font-bold text-sm text-[var(--text-primary)] line-clamp-2">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{p.location}</p>
                    <Link href={`/projects/${p.slug}`}
                      className="inline-block text-[10px] font-black text-[var(--primary)]">
                      View Details →
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--surface-raised)]/40'}>
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
