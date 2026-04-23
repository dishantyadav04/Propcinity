'use client';

import SectionContainer from "@/components/layout/SectionContainer";
import { User, Settings, ShieldCheck, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="bg-[var(--surface)] border-b border-[var(--border)] pt-8 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-6">
          <div className="w-24 h-24 bg-[var(--primary)] rounded-[var(--radius-xl)] flex items-center justify-center text-white text-3xl font-black shadow-[var(--shadow-primary)]">
            JD
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}>John Doe</h1>
            <p className="text-[var(--text-secondary)] font-medium">+91 98765 43210</p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--success-light)] text-[var(--success)] text-xs font-bold rounded-full mt-2">
              <ShieldCheck className="w-3 h-3" /> Phone Verified
            </div>
          </div>
        </div>
      </div>

      <SectionContainer className="max-w-3xl -mt-6">
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
          {[
            { icon: User, label: 'Personal Information', href: '#' },
            { icon: Settings, label: 'Preferences', href: '#' },
            { icon: ShieldCheck, label: 'Privacy & Security', href: '#' },
          ].map((item, i) => (
            <Link key={i} href={item.href}
              className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)] hover:bg-[var(--surface-raised)] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--primary-light)] rounded-full flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <span className="font-bold text-[var(--text-primary)]">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
          <button className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-[var(--danger-light)] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--danger-light)] rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-[var(--danger)]" />
              </div>
              <span className="font-bold text-[var(--danger)]">Log Out</span>
            </div>
          </button>
        </div>
      </SectionContainer>
    </div>
  );
}
