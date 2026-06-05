'use client';

import { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, Eye, Bell, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import SectionContainer from "@/components/layout/SectionContainer";
import { toast } from "sonner";

import { useGuestMode } from "@/hooks/useGuestMode";

export default function PrivacyPage() {
  const router = useRouter();
  const { isGuest } = useGuestMode();

  useEffect(() => {
    if (isGuest) router.replace('/onboarding');
  }, [isGuest, router]);

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [notifications, setNotifications] = useState({ email: true, whatsapp: false, updates: true });

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This will permanently remove all your preferences and saved data. This action cannot be undone.')) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      toast.success('Account deleted successfully');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-[var(--surface-raised)] rounded-[var(--radius-xs)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <h1 className="font-black text-[var(--text-primary)] text-lg flex-1"
            style={{ fontFamily: 'var(--font-display)' }}>Privacy & Security</h1>
        </div>
      </div>

      <SectionContainer className="max-w-3xl space-y-6">
        {/* Trust badge */}
        <div className="flex items-center gap-3 p-4 bg-[var(--success-light)]
          border border-[var(--success)]/20 rounded-[var(--radius)]">
          <ShieldCheck className="w-6 h-6 text-[var(--success)] flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Your data is protected</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              We never sell your data or share it with builders without consent.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
          shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> Notifications
            </p>
          </div>
          {[
            { key: 'email', label: 'Email updates', desc: 'Consultation confirmations and project alerts' },
            { key: 'whatsapp', label: 'WhatsApp messages', desc: 'Advisor follow-ups and visit reminders' },
            { key: 'updates', label: 'Product updates', desc: 'New features and platform improvements' },
          ].map(item => (
            <div key={item.key}
              className="px-4 sm:px-5 py-4 border-b border-[var(--border)] last:border-0
                flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-[var(--primary)]' : 'bg-[var(--border-strong)]'
                }`}>
                <span className={`
                  absolute top-[3px] left-[3px]
                  w-[18px] h-[18px]
                  bg-white rounded-full shadow-sm
                  transition-transform duration-200
                  ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-0'}
                `} />
              </button>
            </div>
          ))}
        </div>

        {/* Data actions */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
          shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Your Data
            </p>
          </div>
          <div className="px-4 sm:px-5 py-4 border-b border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">What we collect</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
              <li>Property preferences (stored locally on your device)</li>
              <li>Consultation requests (name, phone, project interest)</li>
              <li>Anonymous usage analytics (PostHog)</li>
            </ul>
          </div>
          <div className="px-4 sm:px-5 py-4 border-b border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">What we never do</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
              <li>Sell your data to third parties</li>
              <li>Share your details with builders without consent</li>
              <li>Store financial or payment information</li>
            </ul>
          </div>
          <button onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 px-4 sm:px-5 py-4
              hover:bg-[var(--danger-light)] transition-colors text-left">
            <Trash2 className="w-4 h-4 text-[var(--danger)]" />
            <div>
              <p className="text-sm font-bold text-[var(--danger)]">Delete Account</p>
              <p className="text-xs text-[var(--text-muted)]">Permanently remove all your data from this device</p>
            </div>
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] text-center">
          Propcinity Privacy Policy · Last updated Jan 2025
        </p>
      </SectionContainer>
    </div>
  );
}
