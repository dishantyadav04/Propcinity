'use client';

import { useEffect, useState } from "react";
import { UserIntent } from "@/types/user";
import {
  User, Settings, ShieldCheck, ChevronRight,
  LogOut, LayoutDashboard, Sparkles, MapPin, Target, Clock, Edit2,
  Wallet, Scale
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SectionContainer from "@/components/layout/SectionContainer";
import { motion } from "framer-motion";

import { storage, STORAGE_KEYS } from "@/lib/storage";
import { useGuestMode } from "@/hooks/useGuestMode";
import { signOut } from "@/lib/supabase-auth";
import { createClient } from "@/lib/supabase";
import { fetchIntentFromSupabase } from "@/lib/intent-sync";

export default function ProfilePage() {
  const router = useRouter();
  const { isGuest, isChecking } = useGuestMode();
  const [intent, setIntent] = useState<UserIntent | null>(null);
  const [curatedCount, setCuratedCount] = useState(0);
  const [profile, setProfile] = useState<{ display_name?: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    const saved = storage.get<UserIntent | null>(STORAGE_KEYS.USER_INTENT, null);
    if (saved) {
      setIntent(saved);
    } else {
      // Try Supabase fallback (cross-device)
      fetchIntentFromSupabase().then(remote => {
        if (remote) {
          storage.set(STORAGE_KEYS.USER_INTENT, remote);
          setIntent(remote as UserIntent);
        }
      });
    }
    const ids = storage.get<string[]>(STORAGE_KEYS.CURATED_IDS, []);
    setCuratedCount(ids.length);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, phone, email')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  // Server redirect (Task 3) handles this first; these are client-side fallbacks
  if (isChecking) return null
  if (isGuest) return null

  const formatBudget = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    return `₹${(val / 100000).toFixed(0)} L`;
  };

  const handleLogOut = async () => {
    await signOut();
    router.push('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'My Dashboard', href: '/dashboard', desc: 'Your personalized matches' },
    { icon: Scale, label: 'Compare Projects', href: '/compare', desc: 'Side-by-side analysis' },
    { icon: ShieldCheck, label: 'Privacy & Security', href: '/profile/privacy', desc: 'Data and account security' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Identity Header */}
      <div className="bg-white border-b border-[var(--border)] pb-8">
        <SectionContainer className="max-w-3xl text-center flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-[var(--primary-light)] border-2 border-[var(--primary)]
              rounded-full flex items-center justify-center
              shadow-[0_8px_32px_rgba(255,69,0,0.15)] mb-6">
            <User className="w-10 h-10 text-[var(--primary)]" strokeWidth={1.5} />
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              {intent?.name || profile?.display_name || 'Your Profile'}
            </h1>
            <p className="text-[var(--text-secondary)] font-medium">
              {intent?.phone ? `+91 ${intent.phone}` : profile?.phone || profile?.email || 'Setup your profile'}
            </p>
          </div>
        </SectionContainer>
      </div>

      <SectionContainer className="max-w-3xl mt-8 space-y-8">
        {/* Search Preferences Summary */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
              Current Search Preferences
            </h2>
            <Link href="/onboarding?step=2" className="text-xs font-black text-[var(--primary)] hover:underline">
              Retake Quiz
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City & Areas */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-3 relative group">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Location</p>
                <p className="font-bold text-[var(--text-primary)]">{intent?.city || 'Not set'}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                  {intent?.subLocations?.length ? intent.subLocations.join(', ') : 'All areas'}
                </p>
              </div>
              <Link href="/onboarding?step=2" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface-raised)] rounded-lg">
                <Edit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              </Link>
            </div>

            {/* Purpose */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-3 relative group">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Goal</p>
                <p className="font-bold text-[var(--text-primary)]">
                  {intent?.purpose === 'investment' ? 'Investment' : intent?.purpose === 'self-use' ? 'Home for Family' : 'Both'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Focused on ROI & Amenities</p>
              </div>
              <Link href="/onboarding?step=3" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface-raised)] rounded-lg">
                <Edit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              </Link>
            </div>

            {/* Budget */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-3 relative group">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Budget Range</p>
                <p className="font-bold text-[var(--text-primary)]">
                  {intent?.budget ? `${formatBudget(intent.budget.min)} - ${intent.budget.isOpenMax ? 'No Limit' : formatBudget(intent.budget.max)}` : 'Not set'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Total property cost</p>
              </div>
              <Link href="/onboarding?step=6" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface-raised)] rounded-lg">
                <Edit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              </Link>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 space-y-3 relative group">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Timeline</p>
                <p className="font-bold text-[var(--text-primary)] capitalize">
                  {intent?.timeline?.replace(/_/g, ' ') || 'Not set'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Purchase window</p>
              </div>
              <Link href="/onboarding?step=7" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-[var(--surface-raised)] rounded-lg">
                <Edit2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              </Link>
            </div>
          </div>
        </section>

        {/* Navigation Menu */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
            Account & Activity
          </h2>
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow-sm)]">
            {menuItems.map((item, i) => (
              <Link key={i} href={item.href}
                className="flex items-center gap-4 p-5 border-b border-[var(--border)]
                  last:border-0 hover:bg-[var(--surface-raised)] transition-colors group">
                <div className="w-10 h-10 bg-[var(--primary-light)] text-[var(--primary)] 
                  rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--text-primary)] text-sm">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]
                  group-hover:translate-x-1 group-hover:text-[var(--primary)] transition-all" />
              </Link>
            ))}
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={handleLogOut}
          className="w-full flex items-center justify-center gap-3 p-5
          bg-white border border-[var(--border)] rounded-[var(--radius)]
          hover:bg-[var(--danger-light)] transition-colors group">
          <LogOut className="w-5 h-5 text-[var(--danger)]" />
          <span className="font-bold text-[var(--danger)]">Log Out</span>
        </button>
      </SectionContainer>

      {/* Legal links footer */}
      <div className="mt-8 pb-2">
        <SectionContainer>
          <div className="flex items-center justify-center gap-6 py-4 border-t border-[var(--border)]">
            <Link
              href="/privacy"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors font-semibold"
            >
              Privacy Policy
            </Link>
            <span className="text-[var(--border-strong)]">·</span>
            <Link
              href="/terms"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors font-semibold"
            >
              Terms & Conditions
            </Link>
            <span className="text-[var(--border-strong)]">·</span>
            <Link
              href="/contact"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors font-semibold"
            >
              Contact Us
            </Link>
          </div>
        </SectionContainer>
      </div>
    </div>
  );
}
