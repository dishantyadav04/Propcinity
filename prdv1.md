# Propcinity — Complete Fix Prompt for Cursor IDE

> Act as a senior full-stack engineer. Apply every task below precisely. Do not change anything not mentioned. All file paths are relative to the project root.

---

## TASK 1 — Fix the Whitespace Gap Below TopHeader (Root Cause)

**The real problem:** `app/layout.tsx` wraps all pages in `<main className="... pt-0 md:pt-16">`. The TopHeader is `h-16` (64px) and is `sticky top-0`. So desktop correctly offsets with `md:pt-16`. But on **mobile**, the TopHeader still renders (it is NOT hidden on mobile — only the desktop nav links inside it are hidden). This means mobile also needs a `pt-16` offset. Right now mobile gets `pt-0`, so page content slides **under** the sticky header — which looks like negative/missing content at the top.

**Fix `app/layout.tsx`** — change `pt-0 md:pt-16` to `pt-16`:

```tsx
// app/layout.tsx
// BEFORE
<main className="min-h-screen pb-24 md:pb-6 pt-0 md:pt-16">

// AFTER
<main className="min-h-screen pb-24 md:pb-6 pt-16">
```

**Also fix the explore page sticky filter bar** — it uses `sticky top-16` which is correct for desktop, but confirm it stays `top-16` now that mobile also has the header:

```tsx
// app/explore/page.tsx — this line is already correct, keep it:
<div className="sticky top-16 z-30 bg-white border-b border-[var(--border)]">
```

**Also fix `app/dashboard/page.tsx`** — the white hero block has `pt-4` which adds unnecessary extra space on top of layout's `pt-16`. Remove the `pt-4`:

```tsx
// app/dashboard/page.tsx
// BEFORE
<div className="bg-white border-b border-[var(--border)] pt-4 pb-8">

// AFTER
<div className="bg-white border-b border-[var(--border)] pb-8">
```

**Also fix `app/profile/page.tsx`** — same issue, remove `pt-4` from the identity header block:

```tsx
// app/profile/page.tsx
// BEFORE
<div className="bg-white border-b border-[var(--border)] pt-4 pb-8">

// AFTER
<div className="bg-white border-b border-[var(--border)] pb-8">
```

---

## TASK 2 — Fix Mobile Data Not Loading Fully

**Problem:** In `app/explore/page.tsx` and `app/dashboard/page.tsx`, the `fetch('/api/projects')` call has no timeout and silently fails on slow mobile connections. Also `explore` sets `setFiltered(data)` but never triggers `applyFilters()` after data loads — so filters from URL params or existing state don't apply on first render.

**Fix `app/explore/page.tsx`** — add AbortController timeout and ensure `applyFilters` runs after data loads:

Find the fetch block (around line 107) and replace it:

```tsx
// app/explore/page.tsx — replace the fetch useEffect
useEffect(() => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  fetch('/api/projects', { signal: controller.signal })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data: Project[]) => {
      setProjects(data);
      setFiltered(data); // default — applyFilters will override
      if (data.length > 0) setSelectedProject(data[0]);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error('Projects fetch failed:', err);
        setProjects([]);
        setFiltered([]);
      }
    })
    .finally(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

  return () => {
    clearTimeout(timeout);
    controller.abort();
  };
}, []);
```

**Fix `app/dashboard/page.tsx`** — same timeout pattern:

Find the fetch useEffect and replace:

```tsx
// app/dashboard/page.tsx — replace the fetch useEffect
useEffect(() => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  fetch('/api/projects', { signal: controller.signal })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => setProjects(Array.isArray(data) ? data : []))
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error('Projects fetch failed:', err);
        setProjects([]);
      }
    })
    .finally(() => {
      clearTimeout(timeout);
      setIsLoading(false);
    });

  return () => {
    clearTimeout(timeout);
    controller.abort();
  };
}, []);
```

---

## TASK 3 — Remove Profile from Mobile BottomNav, Keep in TopHeader Only

**File: `components/layout/BottomNav.tsx`**

Remove the `Profile` item from `USER_NAV_ITEMS`. The profile avatar in `TopHeader` already handles this on all screen sizes.

```tsx
// components/layout/BottomNav.tsx

// BEFORE
const USER_NAV_ITEMS = [
  { label: 'Home',    href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore',   icon: Compass },
  { label: 'AI Chat', href: '/ai-chat',   icon: Sparkles },
  { label: 'Compare', href: '/compare',   icon: GitCompareArrows },
  { label: 'Profile', href: '/profile',   icon: User },  // ← REMOVE THIS
];

// AFTER
const USER_NAV_ITEMS = [
  { label: 'Home',    href: '/dashboard', icon: Home },
  { label: 'Explore', href: '/explore',   icon: Compass },
  { label: 'AI Chat', href: '/ai-chat',   icon: Sparkles },
  { label: 'Compare', href: '/compare',   icon: GitCompareArrows },
];
```

Also remove the `User` import from lucide-react if it's no longer used anywhere in that file:

```tsx
// BEFORE
import { Home, Compass, Sparkles, GitCompareArrows, User, LogIn } from "lucide-react";

// AFTER
import { Home, Compass, Sparkles, GitCompareArrows, LogIn } from "lucide-react";
```

---

## TASK 4 — Desktop-Only Footer + Privacy/Terms Pages Footer

### 4a — Create `components/layout/Footer.tsx`

Create a new file:

```tsx
// components/layout/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span
              className="text-base font-black text-[var(--text-primary)] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Prop<span className="text-[var(--primary)]">cinity</span>
            </span>
            <p className="text-xs text-[var(--text-muted)]">Zero brokerage. Buyer-first. Always.</p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-xs font-semibold text-[var(--text-secondary)]">
            <Link href="/explore" className="hover:text-[var(--primary)] transition-colors">Explore</Link>
            <Link href="/ai-chat" className="hover:text-[var(--primary)] transition-colors">AI Chat</Link>
            <Link href="/compare" className="hover:text-[var(--primary)] transition-colors">Compare</Link>
            <Link href="/contact" className="hover:text-[var(--primary)] transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms</Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-[var(--text-muted)]">
            © {year} Propcinity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

### 4b — Add Footer to `app/layout.tsx`

```tsx
// app/layout.tsx — add import
import Footer from '@/components/layout/Footer'

// Add Footer just before closing </body> tag, after ClientLayoutExtras:
// BEFORE
        <BottomNav />
        <ClientLayoutExtras />
        <Toaster ...

// AFTER
        <BottomNav />
        <Footer />
        <ClientLayoutExtras />
        <Toaster ...
```

Also update the `<main>` padding so the footer doesn't overlap on desktop — change `md:pb-6` to `md:pb-0`:

```tsx
// BEFORE
<main className="min-h-screen pb-24 md:pb-6 pt-16">

// AFTER
<main className="min-h-screen pb-24 md:pb-0 pt-16">
```

### 4c — Add Footer to `app/privacy/page.tsx`

At the very bottom of the page, before the closing `</div>` of `<main>`, the existing footer block already shows a copyright line. Update it to include full nav links and proper copyright:

```tsx
// app/privacy/page.tsx — replace the existing footer block at the bottom of <main>
{/* Footer */}
<div className="pt-8 border-t border-[var(--border)] space-y-4">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <p className="text-xs text-[var(--text-muted)]">
      © {new Date().getFullYear()} Propcinity. All rights reserved.
    </p>
    <div className="flex items-center gap-4 text-xs font-semibold">
      <Link href="/terms" className="text-[var(--primary)] hover:underline">
        Terms & Conditions
      </Link>
      <Link href="/contact" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
        Contact Us
      </Link>
    </div>
  </div>
  <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
    Propcinity, Pune, Maharashtra, India · hello@propcinity.in
  </p>
</div>
```

### 4d — Add Footer to `app/terms/page.tsx`

Same pattern — replace the existing footer block:

```tsx
// app/terms/page.tsx — replace the existing footer block at the bottom of <main>
{/* Footer */}
<div className="pt-8 border-t border-[var(--border)] space-y-4">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
    <p className="text-xs text-[var(--text-muted)]">
      © {new Date().getFullYear()} Propcinity. All rights reserved.
    </p>
    <div className="flex items-center gap-4 text-xs font-semibold">
      <Link href="/privacy" className="text-[var(--primary)] hover:underline">
        Privacy Policy
      </Link>
      <Link href="/contact" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
        Contact Us
      </Link>
    </div>
  </div>
  <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
    Propcinity, Pune, Maharashtra, India · hello@propcinity.in
  </p>
</div>
```

---

## TASK 5 — Create Contact Page (`app/contact/page.tsx`)

Create a new file `app/contact/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Please fill in your name and message.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
      toast.success('Message sent! We'll get back to you soon.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-[var(--success-light)] rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}>
          Message Received
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
          Thanks for reaching out, {form.name.split(' ')[0]}. We usually respond within 24 hours.
        </p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)] hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-28 space-y-10">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)]
            text-[var(--primary)] text-xs font-bold rounded-full">
            <Mail className="w-3 h-3" /> We'd love to hear from you
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Contact Us
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Have a question, feedback, or partnership inquiry? Drop us a message and we'll respond within 24 hours.
          </p>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: 'Email', value: 'hello@propcinity.in' },
            { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
            { icon: MapPin, label: 'Location', value: 'Pune, Maharashtra' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}
              className="flex items-start gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)]">
              <div className="w-8 h-8 bg-[var(--primary-light)] rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Send a Message
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Full Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Rahul Sharma"
                className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                  rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                  rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Email Address
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="rahul@example.com"
              type="email"
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Subject
            </label>
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                rounded-[var(--radius-xs)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]
                transition-colors appearance-none"
            >
              <option value="">Select a topic...</option>
              <option value="property_inquiry">Property Inquiry</option>
              <option value="partnership">Builder / Partnership</option>
              <option value="feedback">Feedback</option>
              <option value="support">Technical Support</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Message <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder="Tell us how we can help..."
              className="w-full px-3 py-2.5 text-sm bg-[var(--surface-raised)] border border-[var(--border-strong)]
                rounded-[var(--radius-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3
              bg-[var(--primary)] text-white text-sm font-bold rounded-[var(--radius-xs)]
              hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)]
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Message</>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Propcinity. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Terms</Link>
          </div>
        </div>

      </main>
    </div>
  )
}
```

---

## TASK 6 — Create Contact API Route (`app/api/contact/route.ts`)

Create a new file `app/api/contact/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, subject, message } = body

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
    })

    if (error) {
      console.error('Contact insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## TASK 7 — Add `contact_messages` Table to Supabase Schema

Add the following to `lib/schema.sql` at the end of the file:

```sql
-- Contact form messages
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  subject text,
  message text not null,
  status text default 'new', -- new | read | replied
  created_at timestamptz default now()
);

-- Only admins can read; anyone can insert
alter table contact_messages enable row level security;

create policy "Anyone can submit contact message"
  on contact_messages for insert with check (true);

create policy "Admins can read contact messages"
  on contact_messages for select
  using (auth.role() = 'service_role');

create policy "Admins can update contact messages"
  on contact_messages for update
  using (auth.role() = 'service_role');
```

> **Run this migration** in your Supabase SQL editor to create the table before testing the contact form.

---

## TASK 8 — Create Admin Contact Messages Page (`app/admin/contact/page.tsx`)

Create a new file:

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Mail, Search, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  read: 'bg-gray-100 text-gray-600 border-gray-200',
  replied: 'bg-green-50 text-green-700 border-green-200',
};

export default function AdminContactPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    });
    fetch(`/api/admin/contact?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/contact?id=${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}>
            Contact Messages
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{total} total messages</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg
              text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg
            text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {/* Messages list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[var(--surface-raised)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <button
                className="w-full text-left p-4 hover:bg-[var(--surface-raised)] transition-colors"
                onClick={() => {
                  setExpanded(expanded === msg.id ? null : msg.id);
                  if (msg.status === 'new') updateStatus(msg.id, 'read');
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 bg-[var(--primary-light)] rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[var(--primary)]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{msg.name}</p>
                        {msg.subject && (
                          <span className="text-xs text-[var(--text-muted)]">— {msg.subject}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
                        {msg.email && <span>{msg.email}</span>}
                        {msg.phone && <span>{msg.phone}</span>}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[msg.status] || STATUS_STYLE.new}`}>
                      {msg.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </button>

              {expanded === msg.id && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-3 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Mark as:</span>
                    {['new', 'read', 'replied'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(msg.id, s)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border capitalize transition-all ${
                          msg.status === s
                            ? STATUS_STYLE[s]
                            : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your message to Propcinity'}`}
                        className="ml-auto text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        Reply via Email →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## TASK 9 — Create Admin Contact API Route (`app/api/admin/contact/route.ts`)

Create a new file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  let query = supabase
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ messages: data, total: count })
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const supabase = createAdminSupabaseClient()
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { error } = await supabase
    .from('contact_messages')
    .update({ status: body.status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

---

## TASK 10 — Add "Contact" to Admin Sidebar

**File: `components/admin/Sidebar.tsx`**

Add the Contact entry to `ADMIN_NAV`:

```tsx
// Add this import
import { LayoutDashboard, Building2, HardHat, Users, MessageSquare, Settings, LogOut, ExternalLink, Mail } from "lucide-react";

// BEFORE
const ADMIN_NAV = [
  { label: 'Overview',  href: '/admin',              icon: LayoutDashboard },
  { label: 'Projects',  href: '/admin/projects',      icon: Building2 },
  { label: 'Builders',  href: '/admin/builders',      icon: HardHat },
  { label: 'Leads',     href: '/admin/leads',         icon: MessageSquare },
  { label: 'Users',     href: '/admin/users',         icon: Users },
  { label: 'Settings',  href: '/admin/settings',      icon: Settings },
];

// AFTER
const ADMIN_NAV = [
  { label: 'Overview',  href: '/admin',              icon: LayoutDashboard },
  { label: 'Projects',  href: '/admin/projects',      icon: Building2 },
  { label: 'Builders',  href: '/admin/builders',      icon: HardHat },
  { label: 'Leads',     href: '/admin/leads',         icon: MessageSquare },
  { label: 'Contact',   href: '/admin/contact',       icon: Mail },
  { label: 'Users',     href: '/admin/users',         icon: Users },
  { label: 'Settings',  href: '/admin/settings',      icon: Settings },
];
```

---

## Files to Create / Modify — Summary

| Action | File |
|--------|------|
| **MODIFY** | `app/layout.tsx` |
| **MODIFY** | `app/dashboard/page.tsx` |
| **MODIFY** | `app/explore/page.tsx` |
| **MODIFY** | `app/profile/page.tsx` |
| **MODIFY** | `app/privacy/page.tsx` |
| **MODIFY** | `app/terms/page.tsx` |
| **MODIFY** | `components/layout/BottomNav.tsx` |
| **MODIFY** | `components/admin/Sidebar.tsx` |
| **MODIFY** | `lib/schema.sql` |
| **CREATE** | `components/layout/Footer.tsx` |
| **CREATE** | `app/contact/page.tsx` |
| **CREATE** | `app/api/contact/route.ts` |
| **CREATE** | `app/admin/contact/page.tsx` |
| **CREATE** | `app/api/admin/contact/route.ts` |

---

## Post-Implementation Checklist

- [ ] Run the `contact_messages` SQL migration in Supabase dashboard
- [ ] Test `/contact` form submission on mobile and desktop
- [ ] Verify `/admin/contact` shows submitted messages
- [ ] On mobile: TopHeader shows, BottomNav has 4 items (no Profile), profile avatar in header works
- [ ] On desktop: Footer renders below all pages, not on mobile
- [ ] `/privacy` and `/terms` pages show full copyright footer with nav links
- [ ] No whitespace gap visible on `/dashboard`, `/explore`, `/profile` on mobile or desktop
- [ ] Data loads on mobile (check Network tab for `/api/projects` — should resolve within 10s)