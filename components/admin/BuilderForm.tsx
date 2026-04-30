'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { calculateBuilderScore } from '@/lib/scoring-engine';
import { Save, RefreshCw } from 'lucide-react';

interface BuilderFormProps {
  initial?: any;
  mode: 'new' | 'edit';
}

export default function BuilderForm({ initial, mode }: BuilderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || '',
    website: initial?.website || '',
    established_year: initial?.established_year || '',
    headquartered: initial?.headquartered || 'Pune',
    description: initial?.description || '',
    rera_registered: initial?.rera_registered ?? false,
    rera_id: initial?.rera_id || '',
    years_in_business: initial?.years_in_business ||
      (initial?.established_year
        ? Math.max(0, new Date().getFullYear() - parseInt(initial.established_year))
        : 0),
    total_projects_delivered: initial?.total_projects_delivered || 0,
    on_time_delivery_percent: initial?.on_time_delivery_percent ?? 100,
    avg_delay_months: initial?.avg_delay_months || 0,
    legal_cases: initial?.legal_cases || 0,
    customer_complaints: initial?.customer_complaints || 0,
    refund_disputes: initial?.refund_disputes || 0,
  });

  // Auto-compute years_in_business whenever established_year changes
  const computedYearsInBusiness = form.established_year
    ? Math.max(0, new Date().getFullYear() - Number(form.established_year))
    : form.years_in_business;

  // Live score preview
  const liveScore = calculateBuilderScore({
    reraRegistered: form.rera_registered,
    yearsInBusiness: computedYearsInBusiness,
    totalProjectsDelivered: Number(form.total_projects_delivered),
    onTimeDeliveryPercent: Number(form.on_time_delivery_percent),
    avgDelayMonths: Number(form.avg_delay_months),
    legalCases: Number(form.legal_cases),
    customerComplaints: Number(form.customer_complaints),
    refundDisputes: Number(form.refund_disputes),
  });

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Builder name is required'); return; }
    setIsLoading(true);
    const method = mode === 'new' ? 'POST' : 'PUT';
    const url = mode === 'new'
      ? '/api/admin/builders'
      : `/api/admin/builders?id=${initial.id}`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        years_in_business: computedYearsInBusiness,
        total_projects_delivered: Number(form.total_projects_delivered),
        on_time_delivery_percent: Number(form.on_time_delivery_percent),
        avg_delay_months: Number(form.avg_delay_months),
        legal_cases: Number(form.legal_cases),
        customer_complaints: Number(form.customer_complaints),
        refund_disputes: Number(form.refund_disputes),
      }),
    });

    if (res.ok) {
      toast.success(mode === 'new' ? 'Builder created' : 'Builder updated');
      router.push('/admin/builders');
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed');
    }
    setIsLoading(false);
  };

  const scoreColor = liveScore.total >= 80 ? 'text-green-600' : liveScore.total >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}>
          {mode === 'new' ? 'Add Builder' : `Edit: ${initial?.name}`}
        </h1>
        <button onClick={handleSubmit} disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white
            font-bold rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Builder'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Identity */}
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-4">
            <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Identity</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Builder Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Godrej Properties"
                  className="mt-1 w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">Website</label>
                  <input value={form.website} onChange={e => set('website', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                      rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)]">Est. Year</label>
                  <input type="number" value={form.established_year}
                    onChange={e => {
                      const yr = e.target.value;
                      set('established_year', yr);
                      if (yr) {
                        const currentYear = new Date().getFullYear();
                        const yib = Math.max(0, currentYear - parseInt(yr));
                        set('years_in_business', yib);
                      }
                    }}
                    placeholder="2000"
                    className="mt-1 w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                      rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
                  {form.established_year && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      ↳ {Math.max(0, new Date().getFullYear() - parseInt(form.established_year || '0'))} years in business
                      (auto-calculated)
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)]">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="Brief about the builder..."
                  className="mt-1 w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                    rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)] resize-none" />
              </div>
            </div>
          </div>

          {/* Score inputs */}
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-5">
            <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
              Score Inputs (affect trust score of all linked projects)
            </h2>

            {/* RERA */}
            <div className="flex items-center justify-between p-3 bg-[var(--surface-raised)] rounded-[var(--radius-xs)]">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">RERA Registered</p>
                <p className="text-[10px] text-[var(--text-muted)]">+20 to builder score</p>
              </div>
              <button onClick={() => set('rera_registered', !form.rera_registered)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.rera_registered ? 'bg-[var(--primary)]' : 'bg-[var(--border-strong)]'
                }`}>
                <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full
                  shadow-sm transition-transform duration-200 ${
                  form.rera_registered ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            {form.rera_registered && (
              <input value={form.rera_id} onChange={e => set('rera_id', e.target.value)}
                placeholder="RERA ID"
                className="w-full px-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                  rounded-[var(--radius-xs)] text-sm focus:outline-none focus:border-[var(--primary)]" />
            )}

            {/* Auto-calculated years in business — no slider needed */}
            <div className="p-3 bg-[var(--primary-light)] border border-[var(--primary)]/20 rounded-[var(--radius-xs)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Years in Business</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Auto-calculated from Est. Year above</p>
                </div>
                <span className="text-2xl font-black text-[var(--primary)]">
                  {computedYearsInBusiness > 0 ? `${computedYearsInBusiness} yrs` : '—'}
                </span>
              </div>
            </div>

            {/* Remaining sliders */}
            {[
              { key: 'total_projects_delivered', label: 'Projects Delivered', min: 0, max: 200, suffix: '', info: 'Each project = +1pt (max 10)' },
              { key: 'on_time_delivery_percent', label: 'On-Time Delivery %', min: 0, max: 100, suffix: '%', info: '100% = max delivery score' },
              { key: 'avg_delay_months', label: 'Avg Delay (months)', min: 0, max: 36, suffix: 'mo', info: 'Each month = -2pt penalty' },
              { key: 'legal_cases', label: 'Legal Cases', min: 0, max: 10, suffix: '', info: 'Each case = -5pt' },
              { key: 'customer_complaints', label: 'Customer Complaints', min: 0, max: 20, suffix: '', info: 'Each = -2pt' },
              { key: 'refund_disputes', label: 'Refund Disputes', min: 0, max: 10, suffix: '', info: 'Each = -3pt' },
            ].map(field => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold text-[var(--text-primary)]">{field.label}</label>
                  <span className="text-sm font-black text-[var(--primary)]">
                    {(form as any)[field.key]}{field.suffix}
                  </span>
                </div>
                <input type="range" min={field.min} max={field.max}
                  value={(form as any)[field.key]}
                  onChange={e => set(field.key, Number(e.target.value))}
                  className="w-full accent-[var(--primary)]" />
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{field.info}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live score preview */}
        <div className="space-y-4">
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5
            sticky top-8 space-y-5">
            <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
              Live Score Preview
            </h2>
            <div className="text-center">
              <div className="relative w-28 h-28 mx-auto">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-raised)" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={liveScore.total >= 80 ? 'var(--success)' : liveScore.total >= 60 ? 'var(--warning)' : 'var(--danger)'}
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - liveScore.total / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${scoreColor}`}>{liveScore.total}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
                </div>
              </div>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-black capitalize
                ${liveScore.label === 'excellent' ? 'bg-green-50 text-green-600' :
                  liveScore.label === 'good' ? 'bg-blue-50 text-blue-600' :
                  liveScore.label === 'average' ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-600'}`}>
                {liveScore.label}
              </span>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              {Object.entries(liveScore.breakdown).map(([key, val]) => {
                const maxes: Record<string, number> = { rera: 20, trackRecord: 25, delivery: 30, legal: 15, customer: 10 };
                const max = maxes[key] || 30;
                const labels: Record<string, string> = {
                  rera: 'RERA', trackRecord: 'Track Record', delivery: 'Delivery',
                  legal: 'Legal', customer: 'Customer'
                };
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-[var(--text-muted)] font-medium">{labels[key]}</span>
                      <span className="font-black text-[var(--text-primary)]">{val}/{max}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                        style={{ width: `${(val / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              {liveScore.explanation.map((line, i) => (
                <p key={i} className="text-[10px] text-[var(--text-muted)]">• {line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
