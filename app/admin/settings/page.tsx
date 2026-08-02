'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SectionContainer from "@/components/layout/SectionContainer";
import { Settings, Shield, Bell, Database, Globe, Sliders, Save, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import LocationLibraryManager from "@/components/admin/LocationLibraryManager";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.settings?.lead_notification_email) {
          setNotificationEmail(d.settings.lead_notification_email);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSettings(false));
  }, []);

  const saveNotificationEmail = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'lead_notification_email', value: notificationEmail }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Notification email saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    {
      id: 'branding',
      title: 'Platform Branding',
      icon: <Globe className="w-5 h-5" />,
      desc: 'Configure company name, logo, and core design tokens.',
      badge: 'Coming Soon',
      link: null,
    },
    {
      id: 'scoring',
      title: 'Scoring Algorithms',
      icon: <Shield className="w-5 h-5" />,
      desc: 'Adjust weights for RERA, Builder History, and Market Trends.',
      badge: 'Coming Soon',
      link: null,
    },
    {
      id: 'notifications',
      title: 'Lead Notifications',
      icon: <Bell className="w-5 h-5" />,
      desc: 'Configure email and contact phone alerts for new inquiries.',
      badge: 'Configure',
      link: null,
    },
    {
      id: 'cities_localities',
      title: 'Cities & Localities',
      icon: <MapPin className="w-5 h-5" />,
      desc: 'Add, rename, or deactivate cities and their sub-areas used in the Project form.',
      badge: 'Configure',
      link: null,
    },
    {
      id: 'sync',
      title: 'Database Sync',
      icon: <Database className="w-5 h-5" />,
      desc: 'Force refresh project data from Overpass and RERA APIs.',
      badge: 'Coming Soon',
      link: null,
    },
    {
      id: 'access',
      title: 'Access Control',
      icon: <Sliders className="w-5 h-5" />,
      desc: 'Manage administrative roles and platform permissions.',
      badge: 'Configure',
      link: '/admin/users',
    },
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
        {sections.map((s) => (
          <div
            key={s.id}
            className="group bg-white border border-[var(--border)] p-8 rounded-[var(--radius-lg)] shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-[var(--primary-light)] text-[var(--primary)] rounded-2xl flex items-center justify-center">
                {s.icon}
              </div>
              <div
                onClick={() => {
                  if (s.link) {
                    router.push(s.link);
                  } else if (s.id === 'notifications' || s.id === 'cities_localities') {
                    setExpandedCard(expandedCard === s.id ? null : s.id);
                  }
                }}
                className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest transition-colors ${
                  s.badge === 'Coming Soon'
                    ? 'bg-[var(--surface-raised)] text-[var(--text-muted)] cursor-default'
                    : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 cursor-pointer'
                }`}
              >
                {s.badge}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <h3 className={`text-xl font-bold ${s.link || s.id === 'notifications' || s.id === 'cities_localities' ? 'group-hover:text-[var(--primary)] transition-colors' : ''}`}>
                {s.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
            </div>

            {s.id === 'cities_localities' && expandedCard === 'cities_localities' && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <LocationLibraryManager />
              </div>
            )}

            {s.id === 'notifications' && expandedCard === 'notifications' && (
              <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                    disabled={isLoadingSettings}
                  />
                </div>
                <button
                  onClick={saveNotificationEmail}
                  disabled={isSaving || isLoadingSettings}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            )}
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
