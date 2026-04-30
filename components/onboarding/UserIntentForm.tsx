'use client';

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Home, Wallet, MapPin, Target,
  Sparkles, Loader2, Plus, X, Check, User, Phone, Mail,
  ChevronRight, Briefcase, Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const CITY_SUBLOCATIONS: Record<string, string[]> = {
  Pune: [
    "Hinjewadi", "Wakad", "Baner", "Balewadi", "Aundh",
    "Kothrud", "Shivajinagar", "Viman Nagar", "Kalyani Nagar",
    "Koregaon Park", "Kharadi", "Hadapsar", "Wagholi",
    "Mahalunge", "Pimple Saudagar", "Bavdhan", "Pashan",
    "Sus", "Tathawade", "Punawale"
  ],
  Mumbai: [
    "Andheri", "Bandra", "South Mumbai", "Powai", "Goregaon",
    "Malad", "Borivali", "Navi Mumbai", "Thane", "Worli"
  ],
  Bangalore: [
    "Whitefield", "Electronic City", "Koramangala", "Indiranagar", "HSR Layout",
    "Marathahalli", "Bellandur", "Jayanagar", "JP Nagar", "Hebbal"
  ],
  Hyderabad: [
    "HITEC City", "Gachibowli", "Jubilee Hills", "Banjara Hills", "Madhapur",
    "Kondapur", "Kukatpally", "Miyapur", "Manikonda", "Tellapur"
  ]
};

const OPTIONAL_PREFS = [
  "Gated community", "Near school", "Metro connectivity",
  "IT park proximity", "Garden / park nearby", "Low floor",
  "High floor", "East facing", "Corner unit", "Pet friendly",
  "Swimming pool", "Gym", "Co-working space", "Power backup"
];

interface FormData {
  name: string; phone: string; email: string;
  city: string; subLocations: string[];
  purpose: string; propertyType: string[]; bhkType: string[];
  budgetMin: number; budgetMax: number; isOpenMax: boolean;
  timeline: string; preferences: string[];
}

const TOTAL_STEPS = 7;

export default function UserIntentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'form' | 'google' | 'apple' | null>(null);
  const [socialAuthUsed, setSocialAuthUsed] = useState(false);
  const [subInput, setSubInput] = useState('');
  const [showMoreSubLocs, setShowMoreSubLocs] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const startStep = params.get('step');
      if (startStep) {
        const n = parseInt(startStep);
        if (!isNaN(n) && n >= 1 && n <= TOTAL_STEPS) {
          setStep(n);
        }
      }
    }
  }, []);

  const [form, setForm] = useState<FormData>({
    name: '', phone: '', email: '',
    city: 'Pune', subLocations: [],
    purpose: '', propertyType: [], bhkType: [],
    budgetMin: 0, budgetMax: 0, isOpenMax: false,
    timeline: '', preferences: []
  });

  const set = (key: keyof FormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleArr = (key: 'subLocations' | 'propertyType' | 'bhkType' | 'preferences', val: string) => {
    const cur: string[] = form[key] as string[];
    set(key, cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]);
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const canNext = () => {
    if (step === 1) {
      if (socialAuthUsed) return form.phone.length === 10;
      return form.name.length >= 2 && form.phone.length === 10 && form.email.includes('@');
    }
    if (step === 2) return form.city.length > 0;
    if (step === 3) return !!form.purpose;
    if (step === 4) return form.propertyType.length > 0;
    if (step === 5) return form.bhkType.length > 0;
    if (step === 6) return true;
    if (step === 7) return !!form.timeline;
    return true;
  };

  const handleFinish = async () => {
    setIsLoading(true);
    const intent = {
      name: form.name, phone: form.phone, email: form.email,
      city: form.city, subLocations: form.subLocations,
      location: form.city.toLowerCase(),
      workLocation: '',
      purpose: form.purpose as any,
      propertyType: form.propertyType,
      bhkType: form.bhkType,
      budget: { min: form.budgetMin, max: form.budgetMax, isOpenMax: form.isOpenMax },
      timeline: form.timeline,
      preferences: form.preferences,
      rejectedProjects: [], savedProjects: []
    };
    localStorage.setItem('userIntent', JSON.stringify(intent));
    localStorage.setItem('onboarding_complete', 'true');
    await new Promise(r => setTimeout(r, 1000));
    router.push('/dashboard');
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    setSocialAuthUsed(true);
    setAuthMode(provider);
    set('name', provider === 'google' ? 'Google User' : 'Apple User');
    set('email', provider === 'google' ? 'user@gmail.com' : 'user@icloud.com');
  };

  const formatBudget = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  const matchingCount = useMemo(() => {
    if (projects.length === 0) return null;

    let pool = [...projects];

    // ── 1. City filter (always active from step 2) ────────────
    pool = pool.filter(p =>
      (p.city || '').toLowerCase() === form.city.toLowerCase()
    );

    // ── 2. Sub-location filter (active if any selected) ───────
    if (form.subLocations.length > 0) {
      pool = pool.filter(p => {
        const loc = (p.location || '').toLowerCase();
        return form.subLocations.some(sl => {
          const s = sl.toLowerCase();
          // bidirectional: "Hinjewadi" matches "Hinjewadi Phase 2" and vice versa
          return loc.includes(s) || s.includes(loc);
        });
      });
    }

    // ── 3. Property type filter (step 4+, only if selected) ───
    if (step >= 4 && form.propertyType.length > 0) {
      const typeFiltered = pool.filter(p => {
        const types = (p.unitConfigs || []).map((u: any) =>
          (u.type || '').toLowerCase()
        );
        return form.propertyType.some(sel => {
          switch (sel.toLowerCase()) {
            case 'apartment':
              // apartment = anything with BHK number, studio, RK, duplex
              return types.some((t: string) =>
                /^\d/.test(t) ||           // starts with digit: "2bhk", "3bhk"
                t.includes('bhk') ||
                t.includes('studio') ||
                t.includes('rk') ||
                t.includes('duplex')
              );
            case 'villa':
              return types.some((t: string) =>
                t.includes('villa') ||
                t.includes('row house') ||
                t.includes('bungalow') ||
                t.includes('independent')
              );
            case 'plot':
              return types.some((t: string) => t.includes('plot'));
            case 'penthouse':
              return types.some((t: string) =>
                t.includes('penthouse') ||
                t.includes('sky') ||
                (t.includes('4.5') || t.includes('5bhk') || t.includes('5 bhk'))
              );
            default:
              return false;
          }
        });
      });
      // Only apply if it doesn't wipe all results
      if (typeFiltered.length > 0) pool = typeFiltered;
    }

    // ── 4. BHK filter (step 5+, only if selected) ─────────────
    if (step >= 5 && form.bhkType.length > 0) {
      const bhkFiltered = pool.filter(p => {
        const types = (p.unitConfigs || []).map((u: any) =>
          (u.type || '').toLowerCase()
        );
        return form.bhkType.some(sel => {
          const s = sel.toLowerCase().trim();
          // Extract numeric part: "2BHK" → "2", "2.5BHK" → "2.5"
          const numMatch = s.match(/^(\d+\.?\d*)/);
          const num = numMatch ? numMatch[1] : null;
          return types.some((t: string) => {
            if (t === s) return true;          // exact match
            if (t.includes(s)) return true;    // t contains sel
            if (s.includes(t)) return true;    // sel contains t (handles substrings)
            // Numeric prefix match: sel="2bhk" matches t="2.5bhk" only if num matches exactly
            if (num) {
              const tNumMatch = t.match(/^(\d+\.?\d*)/);
              if (tNumMatch && tNumMatch[1] === num) return true;
            }
            return false;
          });
        });
      });
      // Soft: only apply if result > 0
      if (bhkFiltered.length > 0) pool = bhkFiltered;
    }

    // ── 5. Budget filter (step 6+, ONLY if user actually set a budget) ─
    // budgetMin=0 AND budgetMax=0 means user hasn't touched it yet — skip
    const userHasBudget = form.budgetMin > 0 || form.budgetMax > 0;
    if (step >= 6 && userHasBudget) {
      const userMin = form.budgetMin || 0;
      const userMax = form.isOpenMax ? Infinity : (form.budgetMax > 0 ? form.budgetMax : Infinity);

      const budgetFiltered = pool.filter(p => {
        const configs = p.unitConfigs || [];
        if (configs.length === 0) return true; // no price data — include

        // Check if ANY unit config overlaps with user's budget range
        return configs.some((u: any) => {
          const uMin = u.priceMin || 0;
          const uMax = u.priceMax || u.priceMin || 0;
          // Overlap check: project range [uMin, uMax] overlaps user range [userMin, userMax]
          return uMin <= userMax && uMax >= userMin;
        });
      });
      // Soft: keep if > 0
      if (budgetFiltered.length > 0) pool = budgetFiltered;
    }

    // ── 6. Timeline filter (step 7+, soft) ────────────────────
    if (step >= 7 && form.timeline) {
      const now = new Date();
      const timelineFiltered = pool.filter(p => {
        if (!p.possessionDate) return true;
        const poss = new Date(p.possessionDate);
        const monthsFromNow = Math.round(
          (poss.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        // Past possession = already delivered = always include
        if (monthsFromNow <= 0) return true;
        switch (form.timeline) {
          case 'under_1_year':  return monthsFromNow <= 14;
          case '1_to_2_years':  return monthsFromNow <= 30;
          case '3_to_5_years':  return monthsFromNow <= 66;
          case '5_plus':        return true; // everything qualifies
          default:              return true;
        }
      });
      // Soft: never drop to 0 from timeline alone
      if (timelineFiltered.length > 0) pool = timelineFiltered;
    }

    // Preferences have ZERO impact on count — purely cosmetic/soft
    return pool.length;

  }, [projects, form, step]);

  const countForType = (typeId: string): number | null => {
    if (projects.length === 0) return null;
    let base = projects.filter(p =>
      (p.city || '').toLowerCase() === form.city.toLowerCase()
    );
    if (form.subLocations.length > 0) {
      base = base.filter(p => {
        const loc = (p.location || '').toLowerCase();
        return form.subLocations.some(sl => {
          const s = sl.toLowerCase();
          return loc.includes(s) || s.includes(loc);
        });
      });
    }
    return base.filter(p => {
      const types = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
      switch (typeId.toLowerCase()) {
        case 'apartment': return types.some((t: string) =>
          /^\d/.test(t) || t.includes('bhk') || t.includes('studio') ||
          t.includes('rk') || t.includes('duplex')
        );
        case 'villa': return types.some((t: string) =>
          t.includes('villa') || t.includes('row house')
        );
        case 'plot': return types.some((t: string) => t.includes('plot'));
        case 'penthouse': return types.some((t: string) =>
          t.includes('penthouse') || t.includes('4.5') || t.includes('5bhk')
        );
        default: return false;
      }
    }).length;
  };

  const countForBHK = (bhk: string): number | null => {
    if (projects.length === 0) return null;
    let base = projects.filter(p =>
      (p.city || '').toLowerCase() === form.city.toLowerCase()
    );
    if (form.subLocations.length > 0) {
      base = base.filter(p => {
        const loc = (p.location || '').toLowerCase();
        return form.subLocations.some(sl => {
          const s = sl.toLowerCase();
          return loc.includes(s) || s.includes(loc);
        });
      });
    }
    // Apply property type filter if selected
    if (form.propertyType.length > 0) {
      base = base.filter(p => {
        const types = (p.unitConfigs || []).map((u: any) => (u.type || '').toLowerCase());
        return form.propertyType.some(sel => {
          switch (sel.toLowerCase()) {
            case 'apartment': return types.some((t: string) =>
              /^\d/.test(t) || t.includes('bhk') || t.includes('studio') || t.includes('rk') || t.includes('duplex')
            );
            case 'villa': return types.some((t: string) => t.includes('villa') || t.includes('row house'));
            case 'plot': return types.some((t: string) => t.includes('plot'));
            default: return false;
          }
        });
      });
    }
    const s = bhk.toLowerCase().trim();
    const numMatch = s.match(/^(\d+\.?\d*)/);
    const num = numMatch ? numMatch[1] : null;
    return base.filter(p =>
      (p.unitConfigs || []).some((u: any) => {
        const t = (u.type || '').toLowerCase();
        if (t === s || t.includes(s) || s.includes(t)) return true;
        if (num) {
          const tNum = t.match(/^(\d+\.?\d*)/);
          if (tNum && tNum[1] === num) return true;
        }
        return false;
      })
    ).length;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[var(--border)] px-4 sm:px-6 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-black text-[var(--primary)]">
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="h-full bg-gradient-to-r from-[var(--primary)] to-orange-400 rounded-full"
            />
          </div>
          {step >= 2 && (
            <div className="flex justify-center mt-2">
              <motion.div
                key={matchingCount}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all",
                  matchingCount === null
                    ? "bg-[var(--surface-raised)] text-[var(--text-muted)]"
                    : (matchingCount || 0) > 0
                      ? "bg-[var(--success-light)] text-[var(--success)]"
                      : "bg-[var(--danger-light)] text-[var(--danger)]"
                )}>
                {matchingCount === null ? (
                  "LOADING PROJECTS..."
                ) : matchingCount > 0 ? (
                  `${matchingCount} PROJECT${matchingCount === 1 ? '' : 'S'} FOUND`
                ) : (
                  "NO PROJECTS MATCHED"
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

            {/* ── STEP 1: Identity ─────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Let's get started
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Tell us about yourself.
                  </p>
                </div>

                {!socialAuthUsed ? (
                  <div className="space-y-3">
                    <button onClick={() => handleSocialAuth('google')} className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-[var(--border-strong)] rounded-[var(--radius)] hover:border-[var(--primary)] transition-colors font-semibold text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Continue with Google
                    </button>
                    <button onClick={() => handleSocialAuth('apple')} className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--surface-dark)] text-white rounded-[var(--radius)] hover:opacity-90 transition-opacity font-semibold text-sm">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                      Continue with Apple
                    </button>
                    <div className="flex items-center gap-3"><div className="flex-1 h-px bg-[var(--border)]" /><span className="text-xs text-[var(--text-muted)] font-semibold">or fill manually</span><div className="flex-1 h-px bg-[var(--border)]" /></div>
                  </div>
                ) : (
                  <div className="p-4 bg-[var(--success-light)] border border-[var(--success)]/20 rounded-[var(--radius)] flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--success)] rounded-full flex items-center justify-center text-white text-sm">✓</div>
                    <div><p className="text-sm font-bold text-[var(--text-primary)]">{authMode === 'google' ? 'Google' : 'Apple'} account connected</p><p className="text-xs text-[var(--text-muted)]">{form.email}</p></div>
                  </div>
                )}

                {!socialAuthUsed ? (
                  <div className="space-y-3">
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" /><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" className="w-full pl-10 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" /></div>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" /><span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-semibold">+91</span><input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" type="tel" className="w-full pl-16 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" /></div>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" /><input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email address" type="email" className="w-full pl-10 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" /></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">One more thing — your mobile number</p>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" /><span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-semibold">+91</span><input value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" type="tel" className="w-full pl-16 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" /></div>
                    <p className="text-xs text-[var(--text-muted)]">Your advisor will use this to confirm your consultation.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Location ─────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Where are you looking?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Select your city and preferred areas.
                  </p>
                </div>
                {/* City selector */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">City</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(CITY_SUBLOCATIONS).map(c => (
                      <button key={c}
                        onClick={() => { set('city', c); set('subLocations', []); }}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                          form.city === c
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                        )}>{c}</button>
                    ))}
                  </div>
                </div>
                {/* Sub-locations */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
                    Areas in {form.city}
                    <span className="normal-case font-normal ml-1">(add one or more)</span>
                  </p>
                  {/* Selected chips */}
                  {form.subLocations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.subLocations.map(loc => (
                        <span key={loc}
                          className="flex items-center gap-1 px-3 py-1
                            bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-xs font-bold">
                          {loc}
                          <button onClick={() => set('subLocations', form.subLocations.filter(l => l !== loc))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Available area chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {(CITY_SUBLOCATIONS[form.city] || [])
                      .filter(l => !form.subLocations.includes(l))
                      .slice(0, showMoreSubLocs ? undefined : 8)
                      .map(loc => (
                        <button key={loc}
                          onClick={() => {
                            set('subLocations', [...form.subLocations, loc]);
                          }}
                          className="px-3 py-1 border border-[var(--border)] rounded-full
                            text-xs font-medium text-[var(--text-secondary)]
                            bg-[var(--surface-raised)] hover:border-[var(--primary)]
                            hover:text-[var(--primary)] transition-colors">
                          + {loc}
                        </button>
                      ))}
                    {/* More+ / Less- button */}
                    {(CITY_SUBLOCATIONS[form.city] || []).filter(l => !form.subLocations.includes(l)).length > 8 && (
                      <button
                        onClick={() => setShowMoreSubLocs(!showMoreSubLocs)}
                        className="px-3 py-1 border-2 border-dashed border-[var(--primary)]/40
                          text-[var(--primary)] text-xs font-bold rounded-full
                          hover:border-[var(--primary)] transition-colors">
                        {showMoreSubLocs
                          ? '− Less'
                          : `+${(CITY_SUBLOCATIONS[form.city] || []).filter(l => !form.subLocations.includes(l)).length - 8} More`
                        }
                      </button>
                    )}
                  </div>
                  {/* Manual input */}
                  <div className="flex gap-2">
                    <input
                      value={subInput}
                      onChange={e => setSubInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && subInput.trim()) { set('subLocations', [...form.subLocations, subInput.trim()]); setSubInput(''); } }}
                      placeholder="Type a locality and press Enter"
                      className="flex-1 px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)]
                        rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                        placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      onClick={() => { if (subInput.trim()) { set('subLocations', [...form.subLocations, subInput.trim()]); setSubInput(''); } }}
                      className="px-3 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-xs)]">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Purpose ───────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    What's the purpose?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">We'll tailor recommendations to your goal.</p>
                </div>
                {matchingCount !== null && (
                  <p className="text-sm text-[var(--text-muted)]">
                    {matchingCount} projects available in your selected area.
                    Tell us what you're looking for.
                  </p>
                )}
                <div className="space-y-3">
                  {[
                    { id: 'self-use', label: 'Home for my family', sub: 'Focus on amenities & locality', emoji: '🏠' },
                    { id: 'investment', label: 'Investment', sub: 'Focus on ROI & rental yield', emoji: '📈' },
                    { id: 'both', label: 'Both', sub: 'Balanced approach', emoji: '⚖️' }
                  ].map(opt => (
                    <button key={opt.id}
                      onClick={() => { set('purpose', opt.id); next(); }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-[var(--radius)] border text-left transition-all",
                        form.purpose === opt.id
                          ? "bg-[var(--primary-light)] border-[var(--primary)]"
                          : "bg-[var(--surface-raised)] border-[var(--border)] hover:border-[var(--primary)]/50"
                      )}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--text-primary)]">{opt.label}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{opt.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Property Type ─────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    What type of property?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Select all that apply.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'apartment', label: 'Apartment', emoji: '🏢' },
                    { id: 'villa', label: 'Villa / Row House', emoji: '🏡' },
                    { id: 'plot', label: 'Plot', emoji: '🏗️' },
                    { id: 'penthouse', label: 'Penthouse', emoji: '🏰' }
                  ].map(opt => (
                    <button key={opt.id}
                      onClick={() => toggleArr('propertyType', opt.id)}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-[var(--radius)] border text-left transition-all relative",
                        form.propertyType.includes(opt.id)
                          ? "bg-[var(--primary-light)] border-[var(--primary)]"
                          : "bg-[var(--surface-raised)] border-[var(--border)]"
                      )}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <p className="font-bold text-sm text-[var(--text-primary)]">{opt.label}</p>
                      {(() => {
                        const c = countForType(opt.id);
                        return c !== null && (
                          <p className={`text-[10px] font-bold ${c > 0 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                            {c > 0 ? `${c} projects` : 'None found'}
                          </p>
                        );
                      })()}
                      {form.propertyType.includes(opt.id) && (
                        <Check className="absolute top-4 right-4 w-4 h-4 text-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 5: BHK or Plot Size ───────────────────── */}
            {step === 5 && (
              <div className="space-y-6">
                {form.propertyType.some(t => ['apartment', 'villa', 'penthouse'].includes(t)) && (
                  <div>
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text-primary)]"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        How many bedrooms?
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Select all configurations you'd consider.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {['1BHK', '2BHK', '3BHK', '4BHK', '4BHK+', 'Studio'].map(bhk => (
                        <button key={bhk}
                          onClick={() => toggleArr('bhkType', bhk)}
                          className={cn(
                            "py-3 rounded-[var(--radius)] border font-black text-base transition-all flex flex-col items-center justify-center gap-0.5",
                            form.bhkType.includes(bhk)
                              ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-primary)]"
                              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-primary)]"
                          )}>
                          {bhk}
                          {(() => {
                            const c = countForBHK(bhk);
                            return c !== null && c > 0 && (
                              <span className="block text-[9px] font-bold opacity-70">{c}</span>
                            );
                          })()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.propertyType.includes('plot') && (
                  <div>
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text-primary)]"
                        style={{ fontFamily: 'var(--font-display)' }}>
                        What plot size?
                      </h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Select your preferred plot dimensions.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {['Under 1000 sqft', '1000 - 2000 sqft', '2000 - 4000 sqft', '4000+ sqft'].map(size => (
                        <button key={size}
                          onClick={() => toggleArr('bhkType', size)}
                          className={cn(
                            "py-4 px-2 rounded-[var(--radius)] border font-black text-sm text-center transition-all",
                            form.bhkType.includes(size)
                              ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-primary)]"
                              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-primary)]"
                          )}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 6: Budget ────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    What's your budget?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Set your total property budget range.
                  </p>
                </div>

                {/* Quick range selector */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
                    Choose a range
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Under ₹50L', min: 0, max: 5000000 },
                      { label: '₹50L – ₹1Cr', min: 5000000, max: 10000000 },
                      { label: '₹1Cr – ₹2Cr', min: 10000000, max: 20000000 },
                      { label: '₹2Cr – ₹5Cr', min: 20000000, max: 50000000 },
                      { label: '₹5Cr – ₹10Cr', min: 50000000, max: 100000000 },
                      { label: '₹10Cr & above', min: 100000000, max: 200000000, openMax: true },
                    ].map(range => {
                      const isActive = form.budgetMin === range.min && form.budgetMax === range.max;
                      return (
                        <button key={range.label}
                          onClick={() => {
                            set('budgetMin', range.min);
                            set('budgetMax', range.max);
                            set('isOpenMax', !!range.openMax);
                          }}
                          className={`py-3 px-4 rounded-[var(--radius)] border text-sm font-bold text-left transition-all ${
                            isActive
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-primary)]'
                              : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50'
                          }`}>
                          {range.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Manual input */}
                <div className="space-y-3">
                  <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
                    Or enter manually
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-muted)]">Minimum (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">₹</span>
                        <input
                          type="number"
                          value={form.budgetMin === 0 ? '' : Math.round(form.budgetMin / 100000)}
                          onChange={e => {
                            const lakhs = Number(e.target.value);
                            if (!isNaN(lakhs)) set('budgetMin', lakhs * 100000);
                          }}
                          placeholder="e.g. 50"
                          className="w-full pl-7 pr-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                            rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                            focus:outline-none focus:border-[var(--primary)]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">L</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-muted)]">Maximum (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-muted)]">₹</span>
                        <input
                          type="number"
                          value={form.isOpenMax ? '' : form.budgetMax === 0 ? '' : Math.round(form.budgetMax / 100000)}
                          onChange={e => {
                            const lakhs = Number(e.target.value);
                            if (!isNaN(lakhs)) {
                              set('budgetMax', lakhs * 100000);
                              set('isOpenMax', false);
                            }
                          }}
                          placeholder={form.isOpenMax ? 'No limit' : 'e.g. 200'}
                          disabled={form.isOpenMax}
                          className="w-full pl-7 pr-3 py-2.5 bg-[var(--surface-raised)] border border-[var(--border)]
                            rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                            focus:outline-none focus:border-[var(--primary)]
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">L</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Summary */}
                {(form.budgetMin > 0 || form.budgetMax > 0) && (
                  <div className="p-4 bg-[var(--primary-light)] border border-[var(--primary)]/20 rounded-[var(--radius)]">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Your Budget</p>
                    <p className="text-xl font-black text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {form.budgetMin > 0 ? formatBudget(form.budgetMin) : '₹0'}
                      {' '}&mdash;{' '}
                      {form.isOpenMax ? `Above ₹10Cr` : form.budgetMax > 0 ? formatBudget(form.budgetMax) : '?'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 7: Timeline + Optional prefs ────────── */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    When do you plan to buy?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Helps us find ready or near-ready projects.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'under_1_year', label: 'Under 1 Year', sub: 'Ready to move or near possession' },
                    { id: '1_to_2_years', label: '1 to 2 Years', sub: 'Planning stage, some flexibility' },
                    { id: '3_to_5_years', label: '3 to 5 Years', sub: 'Long term, open to under-construction' },
                    { id: '5_plus', label: '5+ Years', sub: 'Investment horizon, early stage projects' },
                  ].map(opt => (
                    <button key={opt.id}
                      onClick={() => set('timeline', opt.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-[var(--radius)] border text-left transition-all",
                        form.timeline === opt.id
                          ? "bg-[var(--primary-light)] border-[var(--primary)]"
                          : "bg-[var(--surface-raised)] border-[var(--border)]"
                      )}>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--text-primary)]">{opt.label}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{opt.sub}</p>
                      </div>
                      {form.timeline === opt.id && (
                        <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Optional preferences */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">
                      Any preferences?
                    </p>
                    <span className="text-[10px] bg-[var(--surface-raised)] text-[var(--text-muted)]
                      px-2 py-0.5 rounded-full font-bold">Optional</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {OPTIONAL_PREFS.map(pref => (
                      <button key={pref}
                        onClick={() => toggleArr('preferences', pref)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          form.preferences.includes(pref)
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                        )}>
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-8 space-y-3">
          {step === 7 ? (
            <button
              disabled={!canNext() || isLoading}
              onClick={handleFinish}
              className="w-full py-4 bg-[var(--primary)] disabled:opacity-50 text-white font-black
                rounded-[var(--radius)] flex items-center justify-center gap-2
                shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              {isLoading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Sparkles className="w-5 h-5" /> See My Recommendations</>
              }
            </button>
          ) : step !== 3 /* step 3 auto-advances */ && (
            <button
              disabled={!canNext()}
              onClick={next}
              className="w-full py-4 bg-[var(--primary)] disabled:opacity-50 text-white font-black
                rounded-[var(--radius)] flex items-center justify-center gap-2
                shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {step > 1 && (
            <button
              onClick={prev}
              className="w-full py-3 text-[var(--text-secondary)] font-bold text-sm
                hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
