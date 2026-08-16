'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Sparkles, Loader2, Plus, X, Check,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { City, Locality } from "@/types/location";

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

const BHK_OPTIONS_LIST = ['1BHK', '2BHK', '3BHK', '4BHK', '4BHK+', 'Studio']

const BUDGET_OPTIONS_LIST = [
  { label: 'Under ₹50L',      min: 0,         max: 5000000 },
  { label: '₹50L – ₹1Cr',    min: 5000000,   max: 10000000 },
  { label: '₹1Cr – ₹2Cr',    min: 10000000,  max: 20000000 },
  { label: '₹2Cr – ₹5Cr',    min: 20000000,  max: 50000000 },
  { label: '₹5Cr – ₹10Cr',   min: 50000000,  max: 100000000 },
  { label: '₹10Cr & above',   min: 100000000, max: Infinity },
]

const TIMELINE_OPTIONS_LIST = [
  { id: 'under_1_year',  label: 'Under 1 Year' },
  { id: '1_to_2_years',  label: '1 to 2 Years' },
  { id: '3_to_5_years',  label: '3 to 5 Years' },
  { id: '5_plus',        label: '5+ Years' },
]

const TOTAL_STEPS = 6;

export default function UserIntentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [subInput, setSubInput] = useState('');
  const [showMoreSubLocs, setShowMoreSubLocs] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

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
    city: '', subLocations: [],
    purpose: '', propertyType: [], bhkType: [],
    budgetMin: 0, budgetMax: 0, isOpenMax: false,
    timeline: '', preferences: []
  });

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [localitiesLoading, setLocalitiesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/locations/cities');
        const data = await res.json();
        if (cancelled) return;

        const fetchedCities: City[] = data.cities || [];
        setCities(fetchedCities);
        if (fetchedCities.length > 0) {
          const firstCity = fetchedCities[0];
          setSelectedCityId(firstCity.id);
          setForm(prev => ({ ...prev, city: prev.city || firstCity.name }));
        }
      } catch (err) {
        console.error('[onboarding] failed to load cities:', err);
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCityId) {
      setLocalities([]);
      return;
    }

    let cancelled = false;
    setLocalitiesLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/locations/localities?city_id=${selectedCityId}`);
        const data = await res.json();
        if (!cancelled) setLocalities(data.localities || []);
      } catch (err) {
        console.error('[onboarding] failed to load localities:', err);
        if (!cancelled) setLocalities([]);
      } finally {
        if (!cancelled) setLocalitiesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  const set = (key: keyof FormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleArr = (key: 'subLocations' | 'propertyType' | 'bhkType' | 'preferences', val: string) => {
    const cur: string[] = form[key] as string[];
    set(key, cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]);
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const canNext = () => {
    if (step === 1) return form.city.length > 0;
    if (step === 2) return !!form.purpose;
    if (step === 3) return form.propertyType.length > 0;
    if (step === 4) return form.bhkType.length > 0;
    if (step === 5) return true;
    if (step === 6) return !!form.timeline && consentGiven;
    return true;
  };

  const handleFinish = async () => {
    setIsLoading(true);

    const supabase = (await import('@/lib/supabase')).createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const name = user?.user_metadata?.full_name ?? ''
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('id', user?.id)
      .single()
    const phone = user?.user_metadata?.phone ?? profileData?.phone ?? ''
    const email = user?.email ?? ''

    const intent = {
      name, phone, email,
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
    storage.set(STORAGE_KEYS.USER_INTENT, intent);
    storage.set(STORAGE_KEYS.ONBOARDING_DONE, true);

    try {
      if (user) {
        // 1. Update user_profiles with onboarding state
        await supabase.from('user_profiles').upsert({
          id: user.id,
          display_name: name,
          phone: phone,
          email: email,
          city: form.city,
          onboarding_complete: true,
          last_active: new Date().toISOString(),
        }, { onConflict: 'id' })

        // Populate the onboarding-status cache cookie now, so the redirect to
        // /dashboard right after this doesn't hit a cache miss in proxy.ts.
        fetch('/api/onboarding/complete', { method: 'POST' })
          .catch((err) => console.warn('[onboarding] cache cookie set failed (non-blocking):', err))

        // 2. Save intent answers to user_intents
        const intentPayload = {
          user_id: user.id,
          city: form.city,
          bhk_types: form.bhkType,
          purpose: form.purpose,
          timeline: form.timeline,
          budget_min: form.budgetMin,
          budget_max: form.isOpenMax ? null : form.budgetMax,
          intent_data: {
            subLocations: form.subLocations,
            propertyType: form.propertyType,
            preferences: form.preferences,
          },
          raw_answers: {
            city: form.city,
            subLocations: form.subLocations,
            purpose: form.purpose,
            propertyType: form.propertyType,
            bhkType: form.bhkType,
            budgetMin: form.budgetMin,
            budgetMax: form.budgetMax,
            isOpenMax: form.isOpenMax,
            timeline: form.timeline,
            preferences: form.preferences,
          },
          updated_at: new Date().toISOString(),
        }

        const { error: intentError } = await supabase
          .from('user_intents')
          .upsert(intentPayload, { onConflict: 'user_id' })

        if (intentError) {
          if (intentError.code === '42P10') {
            // Unique constraint missing on user_id — SQL migration not run yet.
            // Fall back to manual check-then-insert/update.
            console.warn('[onboarding] upsert fallback: unique constraint missing on user_intents.user_id')
            const { data: existing } = await supabase
              .from('user_intents')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()

            if (existing) {
              await supabase.from('user_intents').update(intentPayload).eq('user_id', user.id)
            } else {
              await supabase.from('user_intents').insert(intentPayload)
            }
          } else {
            console.error('[onboarding] user_intents upsert failed:', intentError)
          }
        }

        // 3. Trigger AI embedding — fire-and-forget, never block the user
        fetch('/api/ai/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intent }),
        }).catch((err) => console.warn('[onboarding] embed call failed (non-blocking):', err))
      }
    } catch (err) {
      console.warn('[onboarding] Profile/intent upsert failed:', err)
    }

    // 4. Create cold lead — OUTSIDE try/catch so it always fires even if upserts above fail
    //    Fire-and-forget. Never block the user. Never show this error in UI.
    if (user) {
      // Strip +91 prefix before sending — API expects 10 bare digits
      const cleanPhone = phone.replace(/^\+91[\s-]?/, '').replace(/^0/, '').replace(/[\s-]/g, '')

      fetch('/api/leads/cold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone:        cleanPhone,
          email,
          timeline:     form.timeline,
          purpose:      form.purpose,
          city:         form.city,
          budgetMin:    form.budgetMin  || 0,
          budgetMax:    form.isOpenMax  ? null : (form.budgetMax || 0),
          isOpenBudget: form.isOpenMax,
          bhkTypes:     form.bhkType,
          subLocations: form.subLocations,
          propertyType: form.propertyType,
          preferences:  form.preferences,
        }),
      }).catch(err => console.error('[onboarding] cold lead creation failed silently:', err))
    }

    await new Promise(r => setTimeout(r, 1000));
    router.push('/dashboard');
  };

  const formatBudget = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <h1 className="sr-only">Tell us what you&apos;re looking for</h1>
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

            {/* ── STEP 1: Location ─────────── */}
            {step === 1 && (
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
                    {citiesLoading ? (
                      <span className="text-sm text-[var(--text-muted)]">Loading cities…</span>
                    ) : cities.length === 0 ? (
                      <span className="text-sm text-[var(--text-muted)]">No cities available yet</span>
                    ) : (
                      cities.map(c => (
                        <button key={c.id}
                          onClick={() => {
                            setSelectedCityId(c.id);
                            set('city', c.name);
                            set('subLocations', []);
                            setShowMoreSubLocs(false);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                            form.city === c.name
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                          )}>{c.name}</button>
                      ))
                    )}
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
                    {localitiesLoading ? (
                      <span className="text-xs text-[var(--text-muted)]">Loading areas…</span>
                    ) : (
                      <>
                        {localities
                          .map(l => l.name)
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
                        {localities.map(l => l.name).filter(l => !form.subLocations.includes(l)).length > 8 && (
                          <button
                            onClick={() => setShowMoreSubLocs(!showMoreSubLocs)}
                            className="px-3 py-1 border-2 border-dashed border-[var(--primary)]/40
                              text-[var(--primary)] text-xs font-bold rounded-full
                              hover:border-[var(--primary)] transition-colors">
                            {showMoreSubLocs
                              ? '− Less'
                              : `+${localities.map(l => l.name).filter(l => !form.subLocations.includes(l)).length - 8} More`
                            }
                          </button>
                        )}
                      </>
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
                        "flex flex-col gap-2 p-4 rounded-[var(--radius)] border text-left transition-all relative",
                        form.propertyType.includes(opt.id)
                          ? "bg-[var(--primary-light)] border-[var(--primary)]"
                          : "bg-[var(--surface-raised)] border-[var(--border)]"
                      )}>
                      <span className="text-2xl">{opt.emoji}</span>
                      <p className="font-bold text-sm text-[var(--text-primary)]">{opt.label}</p>
                      {form.propertyType.includes(opt.id) && (
                        <Check className="absolute top-4 right-4 w-4 h-4 text-[var(--primary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: BHK or Plot Size ───────────────────── */}
            {step === 4 && (
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
                      {BHK_OPTIONS_LIST.map(bhk => (
                        <button key={bhk}
                          onClick={() => toggleArr('bhkType', bhk)}
                          className={cn(
                            "py-3 rounded-[var(--radius)] border font-black text-base transition-all flex flex-col items-center justify-center gap-0.5",
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

            {/* ── STEP 5: Budget ────────────────────────────── */}
            {step === 5 && (
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
                    {BUDGET_OPTIONS_LIST.map(option => {
                      const isActive = form.budgetMin === option.min && form.budgetMax === option.max
                      return (
                        <button key={option.label}
                          onClick={() => {
                            set('budgetMin', option.min)
                            set('budgetMax', option.max)
                            set('isOpenMax', option.max === Infinity)
                          }}
                          className={cn(
                            "py-3 px-4 rounded-[var(--radius)] border text-sm font-bold text-left transition-all",
                            isActive
                              ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-primary)]"
                              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50"
                          )}>
                          <span>{option.label}</span>
                        </button>
                      )
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
                    <p className="text-lg font-bold text-[var(--primary)]">
                      {form.budgetMin > 0 ? formatBudget(form.budgetMin) : '₹0'}
                      {' '}&mdash;{' '}
                      {form.isOpenMax ? `Above ₹10Cr` : form.budgetMax > 0 ? formatBudget(form.budgetMax) : '?'}
                    </p>
                  </div>
                )}
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
                  {TIMELINE_OPTIONS_LIST.map(opt => {
                    return (
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
                        </div>
                        {form.timeline === opt.id && (
                          <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
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

                {/* Privacy & Terms consent */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={consentGiven}
                        onChange={e => setConsentGiven(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          consentGiven
                            ? "bg-[var(--primary)] border-[var(--primary)]"
                            : "bg-white border-[var(--border-strong)] group-hover:border-[var(--primary)]"
                        )}
                      >
                        {consentGiven && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      I agree to Propcinity's{' '}
                      <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary)] font-semibold underline underline-offset-2"
                        onClick={e => e.stopPropagation()}
                      >
                        Terms & Conditions
                      </a>
                      {' '}and{' '}
                      <a
                        href="/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--primary)] font-semibold underline underline-offset-2"
                        onClick={e => e.stopPropagation()}
                      >
                        Privacy Policy
                      </a>
                      . I consent to sharing my contact details with builders for properties I enquire about.
                    </p>
                  </label>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-8 space-y-3">
          {step === 6 ? (
            <button
              onClick={handleFinish}
              disabled={!canNext() || isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--primary)] text-white font-black rounded-[var(--radius)] shadow-[var(--shadow-primary)] hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate AI Recommendations
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canNext()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--primary)] text-white font-black rounded-[var(--radius)] shadow-[var(--shadow-primary)] hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              Next Step
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {step > 1 && (
            <button
              onClick={prev}
              className="w-full py-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
