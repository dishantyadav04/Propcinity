'use client';

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import SectionContainer from "@/components/layout/SectionContainer";
import { UserIntent } from "@/types/user";
import { toast } from "sonner";

import { storage, STORAGE_KEYS } from "@/lib/storage";
import { useGuestMode } from "@/hooks/useGuestMode";

export default function PreferencesPage() {
  const router = useRouter();
  const { isGuest, isChecking } = useGuestMode();
  const [intent, setIntent] = useState<UserIntent | null>(null);

  useEffect(() => {
    if (isChecking) return;
    if (isGuest) router.replace('/onboarding');
  }, [isGuest, isChecking, router]);

  useEffect(() => {
    const saved = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
    if (saved) setIntent(saved);
  }, []);

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleReset = () => {
    storage.remove(STORAGE_KEYS.USER_INTENT);
    setIntent(null);
    toast.success('Preferences cleared. You can retake the quiz.');
  };

  const displayValue = (val: any) => {
    if (!val) return 'Not set';
    if (typeof val === 'object' && 'min' in val) {
      return `₹${(val.min/100000).toFixed(0)}L – ₹${(val.max/100000).toFixed(0)}L`;
    }
    if (Array.isArray(val)) return val.join(', ') || 'Not set';
    return String(val).replace(/_/g, ' ');
  };

  const prefRows = intent ? [
    { label: 'Location', value: intent.location },
    { label: 'Work Location', value: intent.workLocation },
    { label: 'Budget Range', value: intent.budget },
    { label: 'Purpose', value: intent.purpose },
    { label: 'Property Types', value: intent.propertyType },
    { label: 'Timeline', value: intent.timeline },
  ] : [];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <div className="bg-white border-b border-[var(--border)] sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <h1 className="font-black text-[var(--text-primary)] text-lg flex-1"
            style={{ fontFamily: 'var(--font-display)' }}>Preferences</h1>
        </div>
      </div>

      <SectionContainer className="max-w-3xl">
        {intent ? (
          <div className="space-y-4">
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
              shadow-[var(--shadow-sm)] overflow-hidden">
              {prefRows.map((row, i) => (
                <div key={row.label}
                  className="px-4 sm:px-5 py-3.5 border-b border-[var(--border)] last:border-0
                    flex items-center justify-between gap-4">
                  <p className="text-sm text-[var(--text-muted)] font-semibold">{row.label}</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] capitalize text-right">
                    {displayValue(row.value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => router.push('/onboarding?step=2')}
                className="flex-1 py-3 bg-[var(--primary)] text-white text-sm font-bold
                  rounded-[var(--radius)] shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
                Retake Quiz
              </button>
              <button onClick={handleReset}
                className="px-4 py-3 bg-[var(--danger-light)] text-[var(--danger)]
                  text-sm font-bold rounded-[var(--radius)] hover:opacity-80 transition-opacity">
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 space-y-5 text-center">
            <div className="text-5xl">🎯</div>
            <h2 className="text-2xl font-black text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>No preferences yet</h2>
            <p className="text-[var(--text-secondary)] max-w-xs">
              Take the 60-second quiz to get personalised recommendations.
            </p>
            <button onClick={() => router.push('/onboarding')}
              className="px-8 py-3 bg-[var(--primary)] text-white font-bold rounded-[var(--radius)]
                shadow-[var(--shadow-primary)] hover:opacity-90 transition-opacity">
              Take the Quiz
            </button>
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
