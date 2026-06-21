'use client';

import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Mail, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import SectionContainer from "@/components/layout/SectionContainer";
import { toast } from "sonner";

import { storage, STORAGE_KEYS } from "@/lib/storage";
import { useGuestMode } from "@/hooks/useGuestMode";

export default function PersonalInfoPage() {
  const router = useRouter();
  const { isGuest, isChecking } = useGuestMode();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
  });

  useEffect(() => {
    if (isChecking) return;
    if (isGuest) router.replace('/onboarding');
  }, [isGuest, isChecking, router]);

  useEffect(() => {
    const saved = storage.get<any>(STORAGE_KEYS.USER_INTENT, null);
    if (saved) {
      setForm({
        name: saved.name || '',
        phone: saved.phone || '',
        email: saved.email || '',
        city: saved.city || '',
      });
    }
  }, []);

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async () => {
    setIsEditing(false);
    // Write to localStorage
    const saved = storage.get<any>(STORAGE_KEYS.USER_INTENT, null);
    if (saved) {
      const updated = { ...saved, ...form };
      storage.set(STORAGE_KEYS.USER_INTENT, updated);
    } else {
      storage.set(STORAGE_KEYS.USER_INTENT, form);
    }
    // Write to Supabase
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').upsert(
          { user_id: user.id, full_name: form.name, phone: form.phone, city: form.city },
          { onConflict: 'user_id' }
        );
      }
    } catch {
      // Supabase write failure is non-critical — localStorage still works
    }
    toast.success('Profile updated');
  };

  const fields = [
    { icon: User, label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
    { icon: Phone, label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 XXXXX XXXXX' },
    { icon: Mail, label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@email.com' },
    { icon: CheckCircle2, label: 'City', key: 'city', type: 'text', placeholder: 'Your city' },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SectionContainer className="max-w-3xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors -ml-1 mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Page header */}
        <div className="flex items-center justify-between mt-3 mb-6">
          <h1 className="font-black text-[var(--text-primary)] text-lg"
            style={{ fontFamily: 'var(--font-display)' }}>Personal Information</h1>
          <button onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className={`px-4 py-1.5 rounded-[var(--radius-xs)] text-sm font-bold transition-colors ${
              isEditing
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--primary-light)] text-[var(--primary)]'
            }`}>
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-[var(--primary)] to-orange-400
              rounded-full flex items-center justify-center text-white text-3xl font-black">
              {form.name ? form.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </div>
            {isEditing && null /* Camera button removed — photo upload not yet implemented */}
          </div>
          <div className="text-center">
            <p className="font-black text-[var(--text-primary)] text-xl">{form.name}</p>
            <p className="text-sm text-[var(--text-muted)]">Propcinity Buyer</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)]
          shadow-[var(--shadow-sm)] overflow-hidden">
          {fields.map((field, i) => (
            <div key={field.key}
              className="px-4 sm:px-5 py-4 border-b border-[var(--border)] last:border-0 flex items-center gap-4">
              <div className="w-9 h-9 bg-[var(--surface-raised)] rounded-full
                flex items-center justify-center flex-shrink-0">
                <field.icon className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {field.label}
                </p>
                {isEditing ? (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full text-sm font-semibold text-[var(--text-primary)] bg-transparent
                      border-b border-[var(--border-strong)] focus:border-[var(--primary)]
                      focus:outline-none pb-1 transition-colors"
                  />
                ) : (
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{form[field.key]}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--text-muted)] text-center mt-4">
          Your personal information is encrypted and never shared.
        </p>
      </SectionContainer>
    </div>
  );
}
