'use client';

import { useEffect, useState } from 'react';
import {
  Building2, HardHat, MessageSquare, Users,
  Flame, ThermometerSun, Snowflake,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  projects: number;
  builders: number;
  leads: { total: number; hot: number; warm: number; cold: number };
  users: number;
  recentLeads: any[];
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/projects', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/builders', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/leads', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/users', { credentials: 'include' }).then(r => r.json()),
    ]).then(([proj, build, leads, users]) => {
      const projects = proj.projects || [];
      const builders = build.builders || [];
      const leadsData = leads.leads || [];

      setStats({
        projects: projects.length,
        builders: builders.length,
        leads: {
          total: leads.total || leadsData.length,
          hot: leadsData.filter((l: any) => l.intent_label === 'hot').length,
          warm: leadsData.filter((l: any) => l.intent_label === 'warm').length,
          cold: leadsData.filter((l: any) => l.intent_label === 'cold').length,
        },
        users: users.users?.length || 0,
        recentLeads: leadsData.slice(0, 5),
      });
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const intentColors = {
    hot: { bg: 'bg-red-50', text: 'text-red-600', icon: Flame },
    warm: { bg: 'bg-amber-50', text: 'text-amber-600', icon: ThermometerSun },
    cold: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Snowflake },
  };

  const statusStyle = (status: string) => ({
    new: 'bg-blue-50 text-blue-700',
    contacted: 'bg-amber-50 text-amber-700',
    converted: 'bg-green-50 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  }[status] || 'bg-gray-100 text-gray-500');

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>Overview</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white
            text-sm font-bold rounded-[var(--radius)] hover:opacity-90 transition-opacity">
          + New Project
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: stats?.projects ?? '—', icon: Building2, href: '/admin/projects', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Builders', value: stats?.builders ?? '—', icon: HardHat, href: '/admin/builders', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Leads', value: stats?.leads.total ?? '—', icon: MessageSquare, href: '/admin/leads', color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-light)]' },
          { label: 'Registered Users', value: stats?.users ?? '—', icon: Users, href: '/admin/users', color: 'text-green-500', bg: 'bg-green-50' },
        ].map(card => (
          <Link key={card.label} href={card.href}
            className="bg-white border border-[var(--border)] rounded-[var(--radius)]
              p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)]
                group-hover:text-[var(--primary)] transition-colors" />
            </div>
            <p className="text-2xl font-black text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              {isLoading ? '—' : card.value}
            </p>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Lead intent breakdown */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5">
          <h2 className="text-sm font-black text-[var(--text-primary)] mb-4">Lead Intent Breakdown</h2>
          <div className="grid grid-cols-3 gap-3">
            {(['hot', 'warm', 'cold'] as const).map(intent => {
              const cfg = intentColors[intent];
              const count = stats?.leads[intent] ?? 0;
              const total = stats?.leads.total || 1;
              return (
                <div key={intent} className={`${cfg.bg} rounded-[var(--radius-xs)] p-4 text-center`}>
                  <cfg.icon className={`w-5 h-5 ${cfg.text} mx-auto mb-2`} />
                  <p className={`text-2xl font-black ${cfg.text}`}>{isLoading ? '—' : count}</p>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${cfg.text} opacity-70`}>{intent}</p>
                  <div className="mt-2 h-1 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full ${intent === 'hot' ? 'bg-red-400' : intent === 'warm' ? 'bg-amber-400' : 'bg-blue-400'} rounded-full`}
                      style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }} />
                  </div>
                  <p className={`text-[10px] ${cfg.text} opacity-60 mt-1`}>
                    {total > 0 ? Math.round((count / total) * 100) : 0}%
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-3 text-center">
            ⚡ Call HOT leads within 2 hours for best conversion
          </p>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-black text-[var(--text-primary)]">Recent Leads</h2>
          <Link href="/admin/leads"
            className="text-xs font-bold text-[var(--primary)] hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {isLoading ? (
            [1,2,3].map(i => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-4 w-32 bg-[var(--surface-raised)] rounded animate-pulse" />
                <div className="h-4 w-24 bg-[var(--surface-raised)] rounded animate-pulse ml-auto" />
              </div>
            ))
          ) : stats?.recentLeads.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--text-muted)] text-center">No leads yet</p>
          ) : stats?.recentLeads.map((lead: any) => {
            const intent = lead.intent_label as 'hot' | 'warm' | 'cold';
            const cfg = intentColors[intent] || intentColors.cold;
            return (
              <div key={lead.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className={`w-7 h-7 ${cfg.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <cfg.icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{lead.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{lead.projects?.name || 'Unknown project'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {intent}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {new Date(lead.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
