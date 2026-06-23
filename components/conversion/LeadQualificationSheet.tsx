'use client';

import { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { X, CalendarDays, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Project, UnitConfig } from "@/types/project";
import { toast } from "sonner";
import { storage, STORAGE_KEYS } from "@/lib/storage";

interface LeadQualificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  unitConfig?: UnitConfig;
}

export default function LeadQualificationSheet({ isOpen, onClose, project, unitConfig }: LeadQualificationSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [step, setStep] = useState<1 | 2>(1);
  const [timeline, setTimeline] = useState<string>('exploring');
  const [budgetReady, setBudgetReady] = useState<string>('no_still_planning');
  const [financeType, setFinanceType] = useState<string>('unsure');
  const [purpose, setPurpose] = useState<string>('self_use');

  useEffect(() => {
    if (!isOpen) setStep(1);
  }, [isOpen]);

  // Pre-fill from storage + Supabase for signed-in users
  useEffect(() => {
    if (!isOpen) return

    // 1. localStorage first (fast, works offline)
    const intent = storage.get<Record<string, any> | null>(STORAGE_KEYS.USER_INTENT, null)
    if (intent?.name)    setName(intent.name)
    if (intent?.phone)   setPhone(intent.phone)
    if (intent?.purpose) {
      const mapped = intent.purpose === 'self-use' ? 'self_use' : intent.purpose
      setPurpose(mapped)
    }
    if (intent?.timeline) setTimeline(intent.timeline)

    // 2. Supabase fallback for signed-in users (cross-device)
    import('@/lib/supabase').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return

        supabase.from('user_profiles')
          .select('display_name, phone')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.display_name) setName(prev => prev || data.display_name)
            if (data?.phone) setPhone(prev => prev || data.phone.replace('+91', ''))
          })

        supabase.from('user_intents')
          .select('purpose, timeline')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.purpose) {
              const mapped = data.purpose === 'self-use' ? 'self_use' : data.purpose
              setPurpose(prev => prev || (mapped as any))
            }
            if (data?.timeline) {
              const map: Record<string, string> = {
                under_1_year: 'within_3_months',
                '1_to_2_years': '3_6_months',
                '3_to_5_years': '6_12_months',
                '5_plus': 'exploring',
              }
              setTimeline(prev => prev || (map[data.timeline] ?? data.timeline))
            }
          })
      })
    })
  }, [isOpen])

  const TIMELINE_MAP: Record<string, string> = {
    under_1_year:  'within_3_months',
    '1_to_2_years': '3_6_months',
    '3_to_5_years': '6_12_months',
    '5_plus':       'exploring',
    // pass-through if already in leads format
    within_3_months: 'within_3_months',
    '3_6_months':    '3_6_months',
    '6_12_months':   '6_12_months',
    exploring:       'exploring',
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/^\+91[\s-]?/, '').replace(/[\s-]/g, '');
    setIsLoading(true);

    const savedIds   = storage.get<string[]>(STORAGE_KEYS.SAVED_IDS, []);
    const rejectedIds = storage.get<string[]>(STORAGE_KEYS.REJECTED_IDS, []);
    const curatedIds  = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);

    try {
      const res = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: cleanPhone,
          preferredTime,
          projectId: project.id,
          unitConfigId: unitConfig?.id,
          timeline: TIMELINE_MAP[timeline] ?? 'exploring',
          budgetReady,
          financeType,
          decisionMaker: 'myself',
          purpose,
          triggerSource: 'consultation_sheet',
          // Buyer context
          savedProjectIds:    savedIds,
          rejectedProjectIds: rejectedIds,
          curatedProjectIds:  curatedIds,
        }),
      });
      if (res.status === 409) {
        toast.error("You've already requested a consultation for this project.");
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed');
      setIsSuccess(true);
      toast.success('Consultation requested!');
      setTimeout(() => { setIsSuccess(false); onClose(); }, 2000);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Please fill name and phone');
      return;
    }
    const cleanPhone = phone.replace(/^\+91[\s-]?/, '').replace(/[\s-]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setStep(2);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-[20px] bg-[var(--surface)] border-t border-[var(--border)] max-h-[96vh] focus:outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--border)]" />
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Talk to Advisor</h2>
                <p className="text-sm text-[var(--text-muted)]">Get expert guidance for {project.name}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-[var(--surface-raised)] rounded-full">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <CheckCircle2 className="w-16 h-16 text-[var(--success)]" />
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Request Received!</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Our property advisor will contact you shortly.</p>
                </div>
              </div>
            ) : step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Full Name</label>
                  <input required type="text" placeholder="John Doe"
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Phone Number</label>
                  <input required type="tel" placeholder="98765 43210"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-primary)]">Preferred Time</label>
                  <select value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)]">
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                    <option value="evening">Evening (4PM - 7PM)</option>
                  </select>
                </div>
                
                <button type="button" onClick={handleNext}
                  className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl mt-6">
                  Next →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">A few quick questions</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">When are you planning to buy?</label>
                    <select value={timeline} onChange={e => setTimeline(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm">
                      <option value="within_3_months">Within 3 months</option>
                      <option value="3_6_months">3–6 months</option>
                      <option value="6_12_months">6–12 months</option>
                      <option value="exploring">Just exploring</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Is your budget ready?</label>
                    <select value={budgetReady} onChange={e => setBudgetReady(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm">
                      <option value="yes_full">Yes, fully ready</option>
                      <option value="yes_partial">Partially ready</option>
                      <option value="loan_approved">Loan approved</option>
                      <option value="no_still_planning">Still planning</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">How will you finance?</label>
                    <select value={financeType} onChange={e => setFinanceType(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm">
                      <option value="self_funded">Self-funded</option>
                      <option value="loan_approved">Loan – already approved</option>
                      <option value="loan_not_applied">Loan – not applied yet</option>
                      <option value="unsure">Not sure yet</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Purpose of purchase?</label>
                    <select value={purpose} onChange={e => setPurpose(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-sm">
                      <option value="self_use">Self use</option>
                      <option value="investment">Investment</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-bold py-4 rounded-xl mt-6 disabled:opacity-70">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarDays className="w-5 h-5" />}
                  <span>{isLoading ? 'Submitting...' : 'Request Call Back'}</span>
                </button>
              </form>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
