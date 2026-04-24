'use client';

import SectionContainer from "@/components/layout/SectionContainer";
import { Users, Layout, MessageSquare, TrendingUp, ShieldCheck, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminOverviewPage() {
  const stats = [
    { label: 'Total Projects', value: '52', change: '+4', icon: <Layout className="w-5 h-5" /> },
    { label: 'Platform Leads', value: '1,284', change: '+12%', icon: <Users className="w-5 h-5" /> },
    { label: 'AI Conversations', value: '450', change: '+24%', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Avg Trust Score', value: '78', change: '-2', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <SectionContainer wide className="py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Admin Overview
          </h1>
          <p className="text-[var(--text-secondary)]">Platform health and operational performance metrics.</p>
        </div>
        <Link href="/admin/projects/new" className="px-5 py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl text-sm">
          + Add Project
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-[var(--border)] p-6 rounded-[var(--radius-lg)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-[var(--surface-raised)] rounded-xl flex items-center justify-center text-[var(--text-secondary)]">
                {s.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {s.change}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{s.label}</p>
              <h3 className="text-2xl font-black mt-1">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div className="bg-white border border-[var(--border)] p-8 rounded-[var(--radius-lg)] shadow-sm space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" /> Recent Activity
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                <div className="w-8 h-8 bg-[var(--primary-light)] rounded-full flex items-center justify-center text-[var(--primary)] text-[10px] font-bold">L</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">New Lead for Godrej Woodsville</p>
                  <p className="text-xs text-[var(--text-muted)]">2 minutes ago · Phone: +91 98XXX XXX00</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface-dark)] text-white p-8 rounded-[var(--radius-lg)] shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Need to adjust project parameters?</h3>
            <p className="text-white/60 text-sm">Use our calculator to simulate how different variables affect a project's Trust Score.</p>
          </div>
          <Link href="/admin/score-calculator" className="mt-8 w-full py-3 bg-white text-black font-bold rounded-xl text-center hover:bg-gray-100 transition-colors">
            Open Score Calculator
          </Link>
        </div>
      </div>
    </SectionContainer>
  );
}
