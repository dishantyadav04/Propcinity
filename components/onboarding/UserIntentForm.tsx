'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Home, Wallet, MapPin, Target, Sparkles, Loader2 } from "lucide-react";
import { UserIntent } from "@/types/user";
import { trackOnboardingStep, trackOnboardingCompleted } from "@/lib/posthog-events";
import { useRouter } from "next/navigation";

export default function UserIntentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [intent, setIntent] = useState<Partial<UserIntent>>({
    budget: { min: 4000000, max: 15000000 },
    purpose: 'self-use',
    location: 'pune',
    propertyType: ['apartment'],
    timeline: '3_6_months'
  });

  const nextStep = () => {
    trackOnboardingStep(step, steps[step - 1].title);
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleFinish = async () => {
    setIsLoading(true);
    trackOnboardingCompleted(intent as any);
    localStorage.setItem('userIntent', JSON.stringify(intent));
    localStorage.setItem('onboarding_complete', 'true');
    
    // Simulate processing
    await new Promise(r => setTimeout(r, 1500));
    router.push('/dashboard');
  };

  const steps = [
    {
      id: 1,
      title: "What's the purpose of your purchase?",
      subtitle: "We'll tailor recommendations based on your goal.",
      icon: Target
    },
    {
      id: 2,
      title: "What's your budget range?",
      subtitle: "Total all-inclusive price including registration.",
      icon: Wallet
    },
    {
      id: 3,
      title: "Preferred property type?",
      subtitle: "Select all that apply.",
      icon: Home
    },
    {
      id: 4,
      title: "When are you planning to buy?",
      subtitle: "Your timeline helps us find ready or near-ready projects.",
      icon: Sparkles
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center max-w-md mx-auto p-6 space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
          <span>Step {step} of {steps.length}</span>
          <span>{Math.round((step / steps.length) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full bg-[var(--surface-raised)] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            className="h-full bg-[var(--primary)]" 
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center text-[var(--primary)]">
              {(() => {
                const Icon = steps[step - 1].icon;
                return <Icon className="w-6 h-6" />;
              })()}
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              {steps[step - 1].title}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">{steps[step - 1].subtitle}</p>
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'self-use', label: 'Home for my family', sub: 'Focus on amenities & locality', emoji: '🏠' },
                { id: 'investment', label: 'Investment', sub: 'Focus on ROI & rental yield', emoji: '📈' },
                { id: 'both', label: 'Both', sub: 'Balanced approach', emoji: '⚖️' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setIntent({...intent, purpose: opt.id as any}); nextStep(); }}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all",
                    intent.purpose === opt.id 
                      ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10" 
                      : "bg-[var(--surface-raised)] border-[var(--border)]"
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)]">{opt.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Maximum Budget</p>
                    <p className="text-2xl font-bold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                      ₹{(intent.budget!.max / 10000000).toFixed(1)} Cr
                    </p>
                  </div>
                </div>
                <input 
                  type="range"
                  min={3000000}
                  max={50000000}
                  step={500000}
                  value={intent.budget!.max}
                  onChange={(e) => setIntent({...intent, budget: { min: intent.budget!.min, max: Number(e.target.value) }})}
                  className="w-full h-2 bg-[var(--surface-raised)] rounded-full appearance-none accent-[var(--primary)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                  <span>₹30 L</span>
                  <span>₹5 Cr+</span>
                </div>
              </div>

              <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-[var(--success)]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[var(--success)]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1">Smart Tip</p>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Most premium 2BHKs in trending localities fall between ₹80L – ₹1.2Cr.
                  </p>
                </div>
              </div>

              <button 
                onClick={nextStep}
                className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'apartment', label: 'Apartment', emoji: '🏢' },
                  { id: 'villa', label: 'Villa / Row House', emoji: '🏡' },
                  { id: 'plot', label: 'Plots', emoji: '🏗️' },
                  { id: 'penthouse', label: 'Penthouse', emoji: '🏰' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      const current = intent.propertyType || [];
                      const next = current.includes(opt.id as any) 
                        ? current.filter(t => t !== opt.id) 
                        : [...current, opt.id as any];
                      setIntent({...intent, propertyType: next});
                    }}
                    className={cn(
                      "flex flex-col gap-3 p-5 rounded-2xl border text-left transition-all",
                      intent.propertyType?.includes(opt.id as any)
                        ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10"
                        : "bg-[var(--surface-raised)] border-[var(--border)]"
                    )}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <p className="font-bold text-[var(--text-primary)] text-sm">{opt.label}</p>
                  </button>
                ))}
              </div>

              <button 
                disabled={!intent.propertyType?.length}
                onClick={nextStep}
                className="w-full bg-[var(--primary)] disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'immediately', label: 'Immediately', sub: 'Ready to move or near possession' },
                  { id: '3_6_months', label: 'Within 6 months', sub: 'Planning stage' },
                  { id: 'next_year', label: 'Next Year', sub: 'Exploring upcoming launches' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setIntent({...intent, timeline: opt.id as any})}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all",
                      intent.timeline === opt.id 
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]" 
                        : "bg-[var(--surface-raised)] border-[var(--border)]"
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-[var(--text-primary)]">{opt.label}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{opt.sub}</p>
                    </div>
                    {intent.timeline === opt.id && <div className="w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center text-white"><Check className="w-3 h-3" /></div>}
                  </button>
                ))}
              </div>

              <button 
                disabled={isLoading}
                onClick={handleFinish}
                className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "See Recommendations"} <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 1 && (
        <button 
          onClick={prevStep}
          className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
      )}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

import { ChevronRight, Check } from "lucide-react";
