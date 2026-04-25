'use client';

import { useEffect, useState } from "react";
import { UserIntent } from "@/types/user";
import {
  User, Settings, ShieldCheck, ChevronRight,
  LogOut, Heart, Sparkles, MapPin, Target, Clock, Edit2
} from "lucide-react";
import Link from "next/link";
import SectionContainer from "@/components/layout/SectionContainer";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [intent, setIntent] = useState<UserIntent | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('userIntent');
    if (saved) setIntent(JSON.parse(saved));
    const ids = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    setSavedCount(ids.length);
  }, []);

  const menuItems = [
    { icon: User, label: 'Personal Information', href: '/profile/personal-info', desc: 'Name, phone, email' },
    { icon: Settings, label: 'Preferences', href: '/profile/preferences', desc: 'Budget, location, property type' },
    { icon: ShieldCheck, label: 'Privacy & Security', href: '/profile/privacy', desc: 'Data and account security' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[var(--primary)] to-orange-400 pt-10 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-white/20 backdrop-blur rounded-[var(--radius-xl)]
              flex items-center justify-center text-white text-2xl font-black
              border-2 border-white/30 flex-shrink-0">
            {intent?.name ? intent.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </motion.div>
          <div className="text-white space-y-1">
            <h1 className="text-2xl font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}>{intent?.name || 'User'}</h1>
            <p className="text-white/80 text-sm">{intent?.phone || 'Add phone number'}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1
              bg-white/20 text-white text-xs font-bold rounded-full mt-1">
              <ShieldCheck className="w-3 h-3" /> Phone Verified
            </div>
          </div>
        </div>
      </div>

      <SectionContainer className="max-w-3xl -mt-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/saved"
            className="bg-white border border-[var(--border)] rounded-[var(--radius)]
              p-4 text-center card-hover shadow-[var(--shadow-sm)]">
            <p className="text-3xl font-black text-[var(--primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>{savedCount}</p>
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">
              Saved Projects
            </p>
          </Link>
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
            p-4 text-center shadow-[var(--shadow-sm)]">
            <p className="text-3xl font-black text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              {intent ? '✓' : '—'}
            </p>
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">
              Preferences Set
            </p>
          </div>
        </div>

        {/* Current preferences summary */}
        {intent && (
          <div className="bg-[var(--primary-light)] border border-[var(--primary)]/20
            rounded-[var(--radius)] p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-[var(--primary)] uppercase tracking-wider">
                Your Preferences
              </p>
              <Link href="/profile/preferences"
                className="flex items-center gap-1 text-xs text-[var(--primary)] font-bold">
                <Edit2 className="w-3 h-3" /> Edit
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { icon: MapPin, label: intent.location || 'Pune' },
                { icon: Target, label: intent.purpose === 'investment' ? 'Investment' : 'Self Use' },
                { icon: Clock, label: intent.timeline?.replace(/_/g, ' ') || 'Not set' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <item.icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="font-medium capitalize">{item.label}</span>
                </div>
              ))}
              {intent.budget && (
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <span className="text-[var(--primary)]">₹</span>
                  <span className="font-medium">
                    {(intent.budget.min/100000).toFixed(0)}L –{' '}
                    {(intent.budget.max/100000).toFixed(0)}L
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
          shadow-[var(--shadow-sm)] overflow-hidden mb-4">
          {menuItems.map((item, i) => (
            <Link key={i} href={item.href}
              className="flex items-center gap-4 p-4 sm:p-5 border-b border-[var(--border)]
                last:border-0 hover:bg-[var(--surface-raised)] transition-colors group">
              <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full
                flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-[var(--primary)]" />
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

        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
          shadow-[var(--shadow-sm)] overflow-hidden">
          <button className="w-full flex items-center gap-4 p-4 sm:p-5
            hover:bg-[var(--danger-light)] transition-colors group">
            <div className="w-10 h-10 bg-[var(--danger-light)] rounded-full
              flex items-center justify-center">
              <LogOut className="w-5 h-5 text-[var(--danger)]" />
            </div>
            <span className="font-bold text-[var(--danger)]">Log Out</span>
          </button>
        </div>
      </SectionContainer>
    </div>
  );
}
