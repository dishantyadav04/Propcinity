'use client';

import { useEffect, useState } from 'react';
import { Search, Users, MapPin, Target, Clock, Wallet } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';
import { createResourceCache } from '@/lib/client-cache';
import { formatIndianPrice } from '@/lib/utils';

// 20s TTL — short enough that admin data still feels fresh, long enough to
// skip a full refetch when just switching tabs and coming back.
const usersCache = createResourceCache<any[]>('admin:users', 20 * 1000);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>(usersCache.get() ?? []);
  const [isLoading, setIsLoading] = useState(usersCache.get() === null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const cached = usersCache.get();
    if (cached) {
      setUsers(cached);
      setIsLoading(false);
      return;
    }

    adminFetch('/api/admin/users')
      .then(r => {
        if (!r.ok) console.error('[admin/users] API error', r.status, r.statusText);
        return r.json();
      })
      .then(d => {
        if (d.error) console.error('[admin/users] Response error:', d.error);
        const list = d.users || [];
        setUsers(list);
        usersCache.set(list);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (u.location ?? '').toLowerCase().includes(term) ||
      (u.purpose ?? '').toLowerCase().includes(term) ||
      (u.timeline ?? '').toLowerCase().includes(term)
    );
  });

  const formatBudget = (budget: any) => {
    if (!budget?.min && !budget?.max) return 'Not set';
    const fmt = (v: number) => formatIndianPrice(v, 1).replace(' ', '');
    return `${fmt(budget.min)} – ${fmt(budget.max)}`;
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}>Users</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {users.length} registered user profile{users.length !== 1 ? 's' : ''} with search preferences
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by city, purpose, timeline..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--border)]
            rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-[var(--surface-raised)] rounded-[var(--radius)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <p className="font-bold text-[var(--text-primary)]">No users yet</p>
          <p className="text-sm text-[var(--text-muted)]">Users appear here after completing onboarding</p>
        </div>
      ) : (
        <>
          {/* Summary pills */}
          <div className="flex flex-wrap gap-2">
            {['self-use', 'investment', 'both'].map(purpose => {
              const count = users.filter(u => u.purpose === purpose).length;
              if (!count) return null;
              return (
                <span key={purpose}
                  className="px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)]
                    text-xs font-bold rounded-full capitalize">
                  {purpose.replace(/-/g, ' ')}: {count}
                </span>
              );
            })}
          </div>

          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]/50">
                  {['User', 'City', 'Purpose', 'Budget', 'BHK Type', 'Timeline', 'Updated'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((user, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-raised)]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-black text-[var(--primary)] uppercase">
                            {(user.display_name || user.email || '?').charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {user.display_name || '—'}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email || '—'}</p>
                          {user.phone && (
                            <p className="text-[10px] text-[var(--text-muted)]">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                        <MapPin className="w-3 h-3 text-[var(--primary)]" />
                        {user.location || '—'}
                      </div>
                      {user.work_location && (
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          Work: {user.work_location}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        user.purpose === 'investment' ? 'bg-amber-50 text-amber-700' :
                        user.purpose === 'both' ? 'bg-purple-50 text-purple-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {(user.purpose || '—').replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {formatBudget(user.budget)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.property_types || []).slice(0, 2).map((t: string) => (
                          <span key={t} className="text-[10px] font-bold px-1.5 py-0.5
                            bg-[var(--surface-raised)] border border-[var(--border)] rounded">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] capitalize">
                      {(user.timeline || '—').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
