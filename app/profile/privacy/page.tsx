'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Eye, Bell, Trash2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import SectionContainer from "@/components/layout/SectionContainer";
import { toast } from "sonner";

import { useGuestMode } from "@/hooks/useGuestMode";
import { signOut } from "@/lib/supabase-auth";

export default function ProfilePrivacyPage() {
  const router = useRouter();
  const { isGuest, isChecking } = useGuestMode();
  const [notifications, setNotifications] = useState({ email: true, sms: false, updates: true });

  useEffect(() => {
    if (isChecking) return;
    if (isGuest) router.replace('/onboarding');
  }, [isGuest, isChecking, router]);

  // Load notification prefs from Supabase
  useEffect(() => {
    if (isChecking || isGuest) return
    import('@/lib/supabase').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from('user_profiles')
          .select('notif_email, notif_sms, notif_updates')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setNotifications({
                email: data.notif_email ?? true,
                sms: data.notif_sms ?? false,
                updates: data.notif_updates ?? true,
              })
            }
          })
      })
    })
  }, [isChecking, isGuest])

  if (isChecking || isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This will permanently remove all your preferences and saved data. This action cannot be undone.')) {
      try {
        const { deleteUserAccount } = await import('./actions');
        await deleteUserAccount();
        await signOut();
        toast.success('Account deleted');
        router.push('/');
      } catch (err) {
        console.error('[deleteAccount] Failed:', err)
        toast.error('Account deletion failed. Please contact support@propcinity.in to delete your account.')
        // Do NOT sign out — user may want to try again
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SectionContainer className="max-w-3xl space-y-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors -ml-1 mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="font-black text-[var(--text-primary)] text-lg"
          style={{ fontFamily: 'var(--font-display)' }}>Privacy & Security</h1>

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
            { key: 'sms', label: 'SMS notifications', desc: 'Advisor follow-ups and visit reminders' },
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
                onClick={async () => {
                  const key = item.key as keyof typeof notifications;
                  const newVal = !notifications[key];
                  setNotifications(prev => ({ ...prev, [key]: newVal }));
                  try {
                    const { createClient } = await import('@/lib/supabase');
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from('user_profiles')
                        .update({ [`notif_${key}`]: newVal })
                        .eq('id', user.id);
                    }
                  } catch {
                    setNotifications(prev => ({ ...prev, [key]: !newVal }));
                    toast.error('Failed to save preference');
                  }
                }}
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
              <li>Name, email, and phone number (from sign-up and property enquiries)</li>
              <li>Property preferences, synced to your account now that you're signed in</li>
              <li>Questions you ask our AI assistant (sent to OpenAI to generate answers)</li>
              <li>Usage and session analytics via PostHog, only with your consent</li>
              <li>Device and technical data for security and fraud prevention</li>
            </ul>
            <Link
              href="/privacy-policy"
              className="text-xs font-bold text-[var(--primary)] hover:underline mt-2 inline-block"
            >
              Read the full Privacy Policy →
            </Link>
          </div>
          <div className="px-4 sm:px-5 py-4 border-b border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">What we never do</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
              <li>Sell your data to third parties</li>
              <li>Share your details with builders without consent</li>
              <li>Store financial or payment information</li>
            </ul>
          </div>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 sm:px-5 py-4
              hover:bg-[var(--surface-raised)] transition-colors text-left
              border-b border-[var(--border)]">
            <LogOut className="w-4 h-4 text-[var(--text-secondary)]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Sign Out</p>
              <p className="text-xs text-[var(--text-muted)]">Sign out of your account on this device</p>
            </div>
          </button>
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
