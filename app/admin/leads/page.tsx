'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, Download, Flame, ThermometerSun, Snowflake,
  Phone, Mail, MapPin, Home, Wallet, Clock, X, ChevronDown,
  Building2, Star, AlertCircle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const INTENT_CONFIG = {
  hot:  { icon: Flame,         bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    label: 'HOT',  note: '⚡ Call now' },
  warm: { icon: ThermometerSun, bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  label: 'WARM', note: 'Call today' },
  cold: { icon: Snowflake,     bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   label: 'COLD', note: 'Follow up' },
};

const STATUS_OPTIONS = ['new', 'contacted', 'site_visit_scheduled', 'negotiating', 'converted', 'lost'];

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-amber-50 text-amber-700',
  site_visit_scheduled: 'bg-purple-50 text-purple-700',
  negotiating: 'bg-orange-50 text-orange-700',
  converted: 'bg-green-50 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(intentFilter && { intent: intentFilter }),
      ...(statusFilter && { status: statusFilter }),
    });
    fetch(`/api/admin/leads?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [page, search, intentFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/leads?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success('Status updated'); load(); }
    else toast.error('Failed to update');
  };

  const formatBudget = (min: number, max: number) => {
    const fmt = (v: number) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : `₹${(v/100000).toFixed(0)}L`;
    if (!min && !max) return 'Not set';
    if (!max) return `${fmt(min)}+`;
    return `${fmt(min)} – ${fmt(max)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>Leads</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {total} total leads · Full buyer profiles for your advisors
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)]
          text-sm font-bold rounded-[var(--radius)] hover:bg-[var(--surface-raised)] transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--border)]
              rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="flex items-center gap-2">
          {(['', 'hot', 'warm', 'cold'] as const).map(intent => {
            const cfg = intent ? INTENT_CONFIG[intent] : null;
            return (
              <button key={intent}
                onClick={() => { setIntentFilter(intent); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-xs)]
                  text-xs font-bold transition-all border ${
                  intentFilter === intent
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-white border-[var(--border)] text-[var(--text-secondary)]'
                }`}>
                {cfg && <cfg.icon className="w-3.5 h-3.5" />}
                {intent ? intent.toUpperCase() : 'All'}
              </button>
            );
          })}
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-white border border-[var(--border)] rounded-[var(--radius-xs)]
            text-sm focus:outline-none focus:border-[var(--primary)]">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Leads */}
      <div className="space-y-3">
        {isLoading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-24 bg-[var(--surface-raised)] rounded-[var(--radius)] animate-pulse" />
          ))
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
            <p className="font-bold">No leads found</p>
          </div>
        ) : leads.map(lead => {
          const intent = (lead.intent_label || 'cold') as keyof typeof INTENT_CONFIG;
          const cfg = INTENT_CONFIG[intent] || INTENT_CONFIG.cold;
          const isExpanded = expandedLead === lead.id;

          return (
            <div key={lead.id}
              className={`bg-white border rounded-[var(--radius)] overflow-hidden
                transition-all ${cfg.border} shadow-sm hover:shadow-md`}>

              {/* Summary row */}
              <div className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>

                {/* Intent badge */}
                <div className={`w-10 h-10 ${cfg.bg} rounded-full flex items-center
                  justify-center flex-shrink-0`}>
                  <cfg.icon className={`w-5 h-5 ${cfg.text}`} />
                </div>

                {/* Name + contact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[var(--text-primary)]">{lead.name}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    {intent === 'hot' && (
                      <span className="text-[9px] font-bold text-red-500 animate-pulse">{cfg.note}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <a href={`tel:+91${lead.phone}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-[var(--primary)] font-semibold hover:underline">
                      <Phone className="w-3 h-3" /> +91 {lead.phone}
                    </a>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Building2 className="w-3 h-3" /> {lead.projects?.name || 'Unknown project'}
                    </span>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={lead.status || 'new'}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                    className={`text-xs font-bold px-2 py-1.5 rounded-[var(--radius-xs)] border-0
                      cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--primary)]
                      ${STATUS_STYLE[lead.status] || STATUS_STYLE.new}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded: full buyer profile */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] bg-[var(--surface-raised)]/40 p-5">
                  <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-4">
                    Full Buyer Profile — Use this to match them with the right property
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Contact */}
                    <div className="bg-white rounded-[var(--radius-xs)] p-4 space-y-2 border border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Contact</p>
                      <div className="space-y-1.5">
                        <a href={`tel:+91${lead.phone}`}
                          className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:underline">
                          <Phone className="w-3.5 h-3.5" /> +91 {lead.phone}
                        </a>
                        <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Mail className="w-3.5 h-3.5" /> {lead.email || 'Not provided'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Submitted: {new Date(lead.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Property intent */}
                    <div className="bg-white rounded-[var(--radius-xs)] p-4 space-y-2 border border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Property Intent</p>
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Home className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span className="capitalize">{(lead.purpose || 'self_use').replace(/_/g, ' ')}</span>
                        </p>
                        <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Wallet className="w-3.5 h-3.5 text-[var(--primary)]" />
                          {formatBudget(0, 0)}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                          {(lead.timeline || '').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="bg-white rounded-[var(--radius-xs)] p-4 space-y-2 border border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Qualification</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Budget ready</span>
                          <span className="font-semibold capitalize text-[var(--text-primary)]">
                            {(lead.budget_ready || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Finance</span>
                          <span className="font-semibold capitalize text-[var(--text-primary)]">
                            {(lead.finance_type || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Decision maker</span>
                          <span className="font-semibold capitalize text-[var(--text-primary)]">
                            {(lead.decision_maker || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Family joining visit</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {lead.family_joining ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visit preferences */}
                    <div className="bg-white rounded-[var(--radius-xs)] p-4 space-y-2 border border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Visit Preferences</p>
                      <div className="space-y-1.5 text-sm">
                        {lead.preferred_date && (
                          <p className="text-[var(--text-secondary)]">📅 {lead.preferred_date}</p>
                        )}
                        {lead.preferred_time && (
                          <p className="text-[var(--text-secondary)]">🕐 {lead.preferred_time}</p>
                        )}
                        <p className="text-[var(--text-secondary)]">
                          {lead.weekend_preferred ? '✓ Prefers weekends' : '✗ Weekdays ok'}
                        </p>
                        <p className="text-[var(--text-secondary)]">
                          {lead.virtual_tour_first ? '🖥️ Virtual tour first' : '🏗️ Direct site visit'}
                        </p>
                      </div>
                    </div>

                    {/* Interested project */}
                    <div className="bg-white rounded-[var(--radius-xs)] p-4 space-y-2 border border-[var(--border)]">
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Interested In</p>
                      <div className="space-y-1.5">
                        <p className="font-bold text-[var(--text-primary)]">
                          {lead.projects?.name || 'Unknown project'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {lead.projects?.location}, {lead.projects?.city}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Ref: {lead.booking_ref}
                        </p>
                      </div>
                    </div>

                    {/* Agent actions */}
                    <div className="bg-[var(--primary-light)] border border-[var(--primary)]/20
                      rounded-[var(--radius-xs)] p-4 space-y-3">
                      <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider">
                        Agent Actions
                      </p>
                      <div className="space-y-2">
                        <a href={`tel:+91${lead.phone}`}
                          className="flex items-center gap-2 w-full px-3 py-2 bg-[var(--primary)]
                            text-white text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity">
                          <Phone className="w-3.5 h-3.5" /> Call Now
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lead.phone)
                            toast.success('Phone number copied')
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 bg-[var(--primary)]
                            text-white text-xs font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity">
                          <Phone className="w-3.5 h-3.5" /> Copy Phone
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}
        </p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold border border-[var(--border)]
              rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
            ← Prev
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            className="px-3 py-1.5 text-xs font-bold border border-[var(--border)]
              rounded-[var(--radius-xs)] disabled:opacity-40 hover:bg-[var(--surface-raised)] transition-colors">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
