'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Home, Wallet, MapPin, Target,
  Sparkles, Loader2, Plus, X, Check, User, Phone, Mail,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Pune sub-locations ────────────────────────────────
const PUNE_SUBLOCATIONS = [
  "Hinjewadi", "Wakad", "Baner", "Balewadi", "Aundh",
  "Kothrud", "Shivajinagar", "Viman Nagar", "Kalyani Nagar",
  "Koregaon Park", "Kharadi", "Hadapsar", "Wagholi",
  "Mahalunge", "Pimple Saudagar", "Bavdhan", "Pashan",
  "Sus", "Tathawade", "Punawale"
];

const OPTIONAL_PREFS = [
  "Gated community", "Near school", "Metro connectivity",
  "IT park proximity", "Garden / park nearby", "Low floor",
  "High floor", "East facing", "Corner unit", "Pet friendly",
  "Swimming pool", "Gym", "Co-working space", "Power backup"
];

function cn(...c: any[]) { return c.filter(Boolean).join(' '); }

interface FormData {
  name: string; phone: string; email: string;
  city: string; subLocations: string[];
  purpose: string; propertyType: string[]; bhkType: string[];
  budgetMin: number; budgetMax: number; isOpenMax: boolean;
  timeline: string; preferences: string[];
}

const TOTAL_STEPS = 6;

export default function UserIntentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'form' | 'google' | 'apple' | null>(null);
  const [subInput, setSubInput] = useState('');

  const [form, setForm] = useState<FormData>({
    name: '', phone: '', email: '',
    city: 'Pune', subLocations: [],
    purpose: '', propertyType: [], bhkType: [],
    budgetMin: 3000000, budgetMax: 10000000, isOpenMax: false,
    timeline: '', preferences: []
  });

  const set = (key: keyof FormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleArr = (key: 'subLocations' | 'propertyType' | 'bhkType' | 'preferences', val: string) => {
    const cur: string[] = form[key] as string[];
    set(key, cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]);
  };

  const addSubLocation = (loc: string) => {
    if (!loc.trim() || form.subLocations.includes(loc)) return;
    set('subLocations', [...form.subLocations, loc]);
    setSubInput('');
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const canNext = () => {
    if (step === 1) return form.name.length >= 2 && form.phone.length === 10 && form.email.includes('@');
    if (step === 2) return !!form.purpose;
    if (step === 3) return form.propertyType.length > 0;
    if (step === 4) return form.bhkType.length > 0;
    if (step === 5) return true;
    if (step === 6) return !!form.timeline;
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

  // Google / Apple auth — skip Step 1 for personal info, go to 1A (location)
  const handleSocialAuth = (provider: 'google' | 'apple') => {
    setAuthMode(provider);
    // Pre-fill mock name/email from provider (in real app, OAuth callback fills this)
    set('name', provider === 'google' ? 'Google User' : 'Apple User');
    set('email', provider === 'google' ? 'user@gmail.com' : 'user@icloud.com');
    // Jump to step 1A — which we render as a sub-step of step 1
    setStep(1);
  };

  const formatBudget = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
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
        </div>
      </div>

      {/* Content */}
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

            {/* ── STEP 1: Personal Info + Location ─────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Let's get started
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Tell us about yourself and where you're searching
                  </p>
                </div>

                {/* Social auth buttons */}
                {!authMode && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSocialAuth('google')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-[var(--border-strong)]
                        rounded-[var(--radius)] hover:border-[var(--primary)] transition-colors font-semibold text-sm">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <button
                      onClick={() => handleSocialAuth('apple')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--surface-dark)] text-white
                        rounded-[var(--radius)] hover:opacity-90 transition-opacity font-semibold text-sm">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Continue with Apple
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[var(--border)]" />
                      <span className="text-xs text-[var(--text-muted)] font-semibold">or fill manually</span>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>
                  </div>
                )}

                {/* Personal info fields */}
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Full name"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                        rounded-[var(--radius)] text-sm text-[var(--text-primary)]
                        placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-semibold">+91</span>
                    <input
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile"
                      type="tel"
                      className="w-full pl-16 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                        rounded-[var(--radius)] text-sm text-[var(--text-primary)]
                        placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="Email address"
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)]
                        rounded-[var(--radius)] text-sm text-[var(--text-primary)]
                        placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* Location section */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      City
                    </p>
                    <div className="flex gap-2">
                      {['Pune', 'Mumbai', 'Bangalore', 'Hyderabad'].map(c => (
                        <button key={c}
                          onClick={() => set('city', c)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold border transition-all",
                            form.city === c
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                          )}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      Sub-locations in {form.city} <span className="normal-case font-normal">(add one or more)</span>
                    </p>
                    {/* Selected sub-locations */}
                    {form.subLocations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.subLocations.map(loc => (
                          <span key={loc}
                            className="flex items-center gap-1 px-3 py-1 bg-[var(--primary-light)]
                              text-[var(--primary)] rounded-full text-xs font-bold">
                            {loc}
                            <button onClick={() => set('subLocations', form.subLocations.filter(l => l !== loc))}>
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PUNE_SUBLOCATIONS.filter(l => !form.subLocations.includes(l)).slice(0, 8).map(loc => (
                        <button key={loc}
                          onClick={() => addSubLocation(loc)}
                          className="px-3 py-1 bg-[var(--surface-raised)] border border-[var(--border)]
                            rounded-full text-xs font-medium text-[var(--text-secondary)]
                            hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                          + {loc}
                        </button>
                      ))}
                    </div>
                    {/* Custom input */}
                    <div className="flex gap-2">
                      <input
                        value={subInput}
                        onChange={e => setSubInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSubLocation(subInput)}
                        placeholder="Type a locality and press Enter"
                        className="flex-1 px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)]
                          rounded-[var(--radius-xs)] text-sm text-[var(--text-primary)]
                          placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                      />
                      <button
                        onClick={() => addSubLocation(subInput)}
                        className="px-3 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-xs)]">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Purpose ───────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    What's the purpose?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">We'll tailor recommendations to your goal.</p>
                </div>
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

            {/* ── STEP 3: Property Type ─────────────────────── */}
            {step === 3 && (
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
                        "flex flex-col gap-2 p-4 rounded-[var(--radius)] border text-left transition-all",
                        form.propertyType.includes(opt.id)
                          ? "bg-[var(--primary-light)] border-[var(--primary)]"
                          : "bg-[var(--surface-raised)] border-[var(--border)]"
                      )}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <p className="font-bold text-sm text-[var(--text-primary)]">{opt.label}</p>
                      {form.propertyType.includes(opt.id) && (
                        <Check className="w-4 h-4 text-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: BHK ──────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    How many bedrooms?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Select all configurations you'd consider.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['1BHK', '2BHK', '3BHK', '4BHK', '4BHK+', 'Studio'].map(bhk => (
                    <button key={bhk}
                      onClick={() => toggleArr('bhkType', bhk)}
                      className={cn(
                        "py-4 rounded-[var(--radius)] border font-black text-base transition-all",
                        form.bhkType.includes(bhk)
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-primary)]"
                          : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-primary)]"
                      )}>
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 5: Budget ────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    What's your budget?
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Set your minimum and maximum range.
                  </p>
                </div>

                {/* Min slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Minimum</p>
                    <p className="text-lg font-black text-[var(--text-primary)]"
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {formatBudget(form.budgetMin)}
                    </p>
                  </div>
                  <input type="range" min={1000000} max={50000000} step={500000}
                    value={form.budgetMin}
                    onChange={e => set('budgetMin', Math.min(Number(e.target.value), form.budgetMax - 500000))}
                    className="w-full accent-[var(--primary)]" />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                    <span>₹10 L</span><span>₹5 Cr</span>
                  </div>
                </div>

                {/* Max slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Maximum</p>
                    <p className="text-lg font-black text-[var(--primary)]"
                      style={{ fontFamily: 'var(--font-display)' }}>
                      {form.isOpenMax ? `${formatBudget(form.budgetMax)}+` : formatBudget(form.budgetMax)}
                    </p>
                  </div>
                  <input type="range" min={1000000} max={100000000} step={500000}
                    value={form.budgetMax}
                    onChange={e => {
                      const val = Number(e.target.value);
                      set('budgetMax', Math.max(val, form.budgetMin + 500000));
                      set('isOpenMax', val >= 100000000);
                    }}
                    className="w-full accent-[var(--primary)]" />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                    <span>₹10 L</span><span>₹10 Cr+</span>
                  </div>
                </div>

                {/* Open max toggle */}
                <div className="flex items-center gap-3 p-4 bg-[var(--surface-raised)] rounded-[var(--radius)] border border-[var(--border)]">
                  <button
                    onClick={() => set('isOpenMax', !form.isOpenMax)}
                    className={cn(
                      "relative w-10 h-6 rounded-full transition-colors flex-shrink-0",
                      form.isOpenMax ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]"
                    )}>
                    <span className={cn(
                      "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      form.isOpenMax ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </button>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">No upper limit</p>
                    <p className="text-xs text-[var(--text-muted)]">Show me the best projects above {formatBudget(form.budgetMax)}</p>
                  </div>
                </div>

                {/* Quick select budget ranges */}
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] mb-2">Quick select</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '₹30L–60L', min: 3000000, max: 6000000 },
                      { label: '₹60L–1Cr', min: 6000000, max: 10000000 },
                      { label: '₹1Cr–2Cr', min: 10000000, max: 20000000 },
                      { label: '₹2Cr–5Cr', min: 20000000, max: 50000000 },
                      { label: '₹5Cr+', min: 50000000, max: 100000000, openMax: true },
                    ].map(r => (
                      <button key={r.label}
                        onClick={() => {
                          set('budgetMin', r.min);
                          set('budgetMax', r.max);
                          set('isOpenMax', !!r.openMax);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                          form.budgetMin === r.min && form.budgetMax === r.max
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                        )}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 6: Timeline + Optional prefs ────────── */}
            {step === 6 && (
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
          {step === 6 ? (
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
          ) : step !== 2 /* step 2 auto-advances */ && (
            <button
              disabled={!canNext()}
              onClick={next}
              className="w-full py-4 bg-[var(--primary)] disabled:opacity-50 text-white font-black
                rounded-[var(--radius)] flex items-center justify-center gap-2
                shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step > 1 && (
            <button onClick={prev}
              className="w-full py-3 flex items-center justify-center gap-2
                text-[var(--text-muted)] text-sm font-bold">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
