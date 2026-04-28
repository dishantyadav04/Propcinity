'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Star, HardHat,
  ChevronRight, Building2, CheckCircle2, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function BuildersPage() {
  const [builders, setBuilders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    fetch('/api/admin/builders', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setBuilders(d.builders || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete builder "${name}"? This will unlink all associated projects.`)) return;
    const res = await fetch(`/api/admin/builders?id=${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { toast.success('Builder deleted'); load(); }
    else toast.error('Failed to delete');
  };

  const filtered = builders.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-600 bg-green-50' :
    score >= 60 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';

  const scoreLabel = (score: number) =>
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Poor';

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>Builders</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {builders.length} builder profile{builders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/builders/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white
            text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Builder
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search builders..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--border)]
            rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
      </div>

      {/* Builder cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-[var(--surface-raised)] rounded-[var(--radius)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <HardHat className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="font-bold text-[var(--text-primary)]">No builders yet</h3>
          <Link href="/admin/builders/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)] text-sm">
            <Plus className="w-4 h-4" /> Add your first builder
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(builder => (
            <div key={builder.id}
              className="bg-white border border-[var(--border)] rounded-[var(--radius)]
                shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--surface-raised)] rounded-lg flex items-center
                      justify-center text-[var(--text-muted)] font-black flex-shrink-0">
                      {builder.logo
                        ? <img src={builder.logo} alt={builder.name} className="w-full h-full object-cover rounded-lg" />
                        : <HardHat className="w-5 h-5" />
                      }
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-[var(--text-primary)] truncate">{builder.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">Est. {builder.established_year || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-black px-2.5 py-1 rounded-full ${scoreColor(builder.builder_score || 0)}`}>
                    {builder.builder_score || 0}
                  </span>
                </div>

                {/* Score label */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      (builder.builder_score || 0) >= 80 ? 'bg-green-500' :
                      (builder.builder_score || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`} style={{ width: `${builder.builder_score || 0}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">
                    {scoreLabel(builder.builder_score || 0)}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    {builder.rera_registered
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />
                    }
                    RERA
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {builder.total_projects_delivered || 0} delivered
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {builder.on_time_delivery_percent || 0}% on-time
                  </div>
                  <div className="text-[var(--text-muted)]">
                    {builder.avg_delay_months || 0}mo avg delay
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
                <Link href={`/admin/builders/${builder.id}`}
                  className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                  View Details <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/builders/${builder.id}/edit`}
                    className="p-1.5 hover:bg-[var(--surface-raised)] rounded transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </Link>
                  <button onClick={() => handleDelete(builder.id, builder.name)}
                    className="p-1.5 hover:bg-[var(--danger-light)] rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-[var(--text-danger)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
