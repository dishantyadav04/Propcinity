'use client';

import { useState } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import FreeBuyerBadge from "@/components/trust/FreeBuyerBadge";
import WhatsAppCTA from "@/components/conversion/WhatsAppCTA";
import { Project, UnitConfig } from "@/types/project";
import { trackConsultationCompleted } from "@/lib/posthog-events";
import { toast } from "sonner";

interface LeadQualificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  unitConfig?: UnitConfig;
}

type Step = 'A' | 'B' | 'C' | 'SUCCESS';

export default function LeadQualificationSheet({ isOpen, onClose, project, unitConfig }: LeadQualificationSheetProps) {
  const [step, setStep] = useState<Step>('A');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    timeline: '' as 'within_3_months' | '3_6_months' | '6_12_months' | 'exploring' | '',
    budgetReady: '' as 'yes_full' | 'yes_partial' | 'no_still_planning' | 'loan_approved' | '',
    financeType: '' as 'self_funded' | 'loan_approved' | 'loan_not_applied' | 'unsure' | '',
    decisionMaker: '' as 'myself' | 'family_involved' | 'spouse_only' | 'parents_involved' | '',
    preferredDate: '',
    preferredTime: '',
    familyJoining: false,
    weekendPreferred: false,
    virtualTourFirst: false,
    pickupNeeded: false
  });

  const isStepAValid =
    formData.name.length >= 2 &&
    /^\d{10}$/.test(formData.phone) &&
    formData.timeline !== '' &&
    formData.budgetReady !== '' &&
    formData.financeType !== '' &&
    formData.decisionMaker !== '';

  const handleNext = () => {
    if (step === 'A') setStep('B');
    else if (step === 'B') setStep('C');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          timeline: formData.timeline,
          budgetReady: formData.budgetReady,
          financeType: formData.financeType,
          decisionMaker: formData.decisionMaker,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          familyJoining: formData.familyJoining,
          weekendPreferred: formData.weekendPreferred,
          virtualTourFirst: formData.virtualTourFirst,
          purpose: 'self_use',
          projectId: project.id,
          unitConfigId: unitConfig?.id,
          triggerSource: 'qualification_sheet',
        })
      });

      if (!response.ok) throw new Error("Submission failed");

      trackConsultationCompleted({ projectId: project.id });
      setStep('SUCCESS');
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-[20px] bg-[var(--surface)] border-t border-[var(--border)] max-h-[92vh] focus:outline-none">
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--border)]" />

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-[var(--primary)]">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Talk to a Property Advisor</h2>
              </div>
              <div className="flex justify-center">
                <FreeBuyerBadge variant="inline" />
              </div>
              <p className="text-xs text-[var(--text-muted)]">Takes 60 seconds. No spam, ever.</p>

              <div className="flex justify-center gap-2 pt-2">
                {['A', 'B', 'C'].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      step === s ? "bg-[var(--primary)] w-4" : "bg-[var(--border)]"
                    )}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'A' && (
                <motion.div
                  key="step-a"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Your Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-muted)] text-sm flex items-center">+91</div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                          className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Purchase Timeline</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'within_3_months', label: 'Within 3mo' },
                        { id: '3_6_months', label: '3-6mo' },
                        { id: '6_12_months', label: '6-12mo' },
                        { id: 'exploring', label: 'Exploring' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormData({...formData, timeline: t.id as any})}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm transition-all",
                            formData.timeline === t.id
                              ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-semibold"
                              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">
                      Budget readiness
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'yes_full', label: 'Full Budget Ready' },
                        { id: 'yes_partial', label: 'Partial Ready' },
                        { id: 'loan_approved', label: 'Loan Approved' },
                        { id: 'no_still_planning', label: 'Still Planning' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setFormData({...formData, budgetReady: b.id as any})}
                          className={`py-2.5 px-3 rounded-[var(--radius)] border text-sm font-medium transition-all ${
                            formData.budgetReady === b.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">
                      How are you financing?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'self_funded', label: 'Self Funded' },
                        { id: 'loan_approved', label: 'Loan Approved' },
                        { id: 'loan_not_applied', label: 'Need Loan' },
                        { id: 'unsure', label: 'Not Sure' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFormData({...formData, financeType: f.id as any})}
                          className={`py-2.5 px-3 rounded-[var(--radius)] border text-sm font-medium transition-all ${
                            formData.financeType === f.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">
                      Who is deciding?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'myself', label: 'Myself' },
                        { id: 'family_involved', label: 'Family Involved' },
                        { id: 'spouse_only', label: 'Spouse Only' },
                        { id: 'parents_involved', label: 'Parents Involved' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setFormData({...formData, decisionMaker: d.id as any})}
                          className={`py-2.5 px-3 rounded-[var(--radius)] border text-sm font-medium transition-all ${
                            formData.decisionMaker === d.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'border-[var(--border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={!isStepAValid}
                    onClick={handleNext}
                    className="w-full bg-[var(--primary)] disabled:bg-[var(--border)] disabled:text-[var(--text-muted)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 'B' && (
                <motion.div
                  key="step-b"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Preferred Visit Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                        className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Preferred Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['10 AM - 12 PM', '12 PM - 2 PM', '2 PM - 4 PM', '4 PM - 6 PM'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({...formData, preferredTime: t})}
                            className={cn(
                              "px-4 py-3 rounded-xl border text-sm transition-all",
                              formData.preferredTime === t
                                ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-semibold"
                                : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {[
                      { id: 'familyJoining', label: 'Family joining for visit' },
                      { id: 'weekendPreferred', label: 'Weekend visit preferred' },
                      { id: 'virtualTourFirst', label: 'Virtual tour before visit' },
                      { id: 'pickupNeeded', label: 'Need pickup/drop facility' }
                    ].map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">{opt.label}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, [opt.id]: !formData[opt.id as keyof typeof formData]})}
                          className={cn(
                            "w-10 h-6 rounded-full p-1 transition-colors relative",
                            formData[opt.id as keyof typeof formData] ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                          )}
                        >
                          <motion.div
                            animate={{ x: formData[opt.id as keyof typeof formData] ? 16 : 0 }}
                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    Almost done <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 'C' && (
                <motion.div
                  key="step-c"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 flex gap-4">
                    <img src={project.images[0]} className="w-20 h-20 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{project.name}</p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">{project.location}</p>
                      {unitConfig && <p className="text-xs font-semibold text-[var(--primary)] mt-1">{unitConfig.type}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-muted)]">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Your Assigned Advisor</p>
                        <p className="text-xs text-[var(--text-secondary)]">PropIQ Expert Team</p>
                      </div>
                    </div>

                    <div className="bg-[var(--border)]/30 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Preferred Date</span>
                        <span className="text-[var(--text-primary)] font-medium">{formData.preferredDate || 'TBD'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Time Slot</span>
                        <span className="text-[var(--text-primary)] font-medium">{formData.preferredTime || 'TBD'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Name</span>
                        <span className="text-[var(--text-primary)] font-medium">{formData.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Phone</span>
                        <span className="text-[var(--text-primary)] font-medium">+91 {formData.phone.slice(0, 6)}****</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-[var(--text-muted)] text-center px-6">
                    Our advisor calls within 2 hours. Your details are never shared with builders. No spam, ever.
                  </p>

                  <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Consultation"}
                  </button>
                </motion.div>
              )}

              {step === 'SUCCESS' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8 py-8"
                >
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-[var(--success)]/10 rounded-full flex items-center justify-center">
                      <motion.svg
                        className="w-10 h-10 text-[var(--success)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <motion.path
                          d="M20 6L9 17L4 12"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        />
                      </motion.svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-[var(--success)]" style={{ fontFamily: 'var(--font-display)' }}>You're confirmed!</h2>
                    <p className="text-[var(--text-secondary)]">Our advisor will call you within 2 hours.</p>
                  </div>

                  <div className="flex justify-center">
                    <WhatsAppCTA
                      variant="inline"
                      messageType="consultation"
                      messageData={{
                        name: formData.name,
                        projectName: project.name,
                        date: formData.preferredDate,
                        time: formData.preferredTime
                      }}
                      label="Message us on WhatsApp"
                    />
                  </div>

                  <button
                    onClick={onClose}
                    className="text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    Back to projects
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
