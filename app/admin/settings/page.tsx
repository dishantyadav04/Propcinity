'use client';

import SectionContainer from "@/components/layout/SectionContainer";
import { Settings, Shield, Bell, Database, Globe, Sliders } from "lucide-react";

export default function AdminSettingsPage() {
  const sections = [
    { title: 'Platform Branding', icon: <Globe className="w-5 h-5" />, desc: 'Configure company name, logo, and core design tokens.' },
    { title: 'Scoring Algorithms', icon: <Shield className="w-5 h-5" />, desc: 'Adjust weights for RERA, Builder History, and Market Trends.' },
    { title: 'Lead Notifications', icon: <Bell className="w-5 h-5" />, desc: 'Configure email and WhatsApp alerts for new inquiries.' },
    { title: 'Database Sync', icon: <Database className="w-5 h-5" />, desc: 'Force refresh project data from Overpass and RERA APIs.' },
    { title: 'Access Control', icon: <Sliders className="w-5 h-5" />, desc: 'Manage administrative roles and platform permissions.' },
  ];

  return (
    <SectionContainer wide className="py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          System Settings
        </h1>
        <p className="text-[var(--text-secondary)]">Manage global configuration and platform operational parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((s, i) => (
          <div key={i} className="group bg-white border border-[var(--border)] p-8 rounded-[var(--radius-lg)] shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl flex items-center justify-center">
                {s.icon}
              </div>
              <div className="px-3 py-1 bg-[var(--surface-raised)] text-[var(--text-muted)] text-[10px] font-bold rounded-full uppercase tracking-widest">
                Configure
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors">{s.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-[var(--surface-dark)] text-white p-8 rounded-[var(--radius-lg)] shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">System Status</p>
          <h3 className="text-lg font-bold">All services are operational</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold">Stable</span>
        </div>
      </div>
    </SectionContainer>
  );
}
