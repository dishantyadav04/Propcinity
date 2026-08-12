'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Cookie } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. What this policy covers',
    body: `This Cookie Policy explains how Propcinity ("we", "us", "our") uses cookies and similar technologies (local storage, session storage) on propcinity.in and our mobile app, and how you can control them. It should be read together with our Privacy Policy (propcinity.in/privacy-policy).

Under India's Digital Personal Data Protection Act, 2023, any cookie that collects personal data requires your free, specific, informed, and unambiguous consent before it's set — except cookies strictly necessary for the site to function.`
  }
  {
    title: '2. Cookie categories we use',
    body: `STRICTLY NECESSARY (always active — no consent required, cannot be disabled)
These are required for the site to work at all and don't require consent under DPDPA 2023 since you can't meaningfully use the platform without them.

ANALYTICS (requires your consent)
Helps us understand how visitors use Propcinity, in aggregate. Only set if you actively enable Analytics via the cookie banner or Cookie Preferences.

FUNCTIONAL (requires your consent)
Improves your experience by remembering preferences and enabling features like the AI assistant. Only set if you actively enable Functional via the cookie banner or Cookie Preferences.

We do NOT use advertising or retargeting cookies, and we do NOT use third-party tracking pixels (Meta Pixel, Google Ads, etc.).`
  },
  {
    title: '3. The specific cookies and storage keys we use',
    body: `STRICTLY NECESSARY
• Supabase auth session cookies (sb-*-auth-token) — keeps you signed in. Expires per session/refresh-token policy.
• admin_session — admin-panel authentication only (not set for regular visitors).
• onboarding_complete — remembers that you've finished the onboarding questionnaire, so you're not asked again. Set for 1 year.
• cookie-consent (local storage) — remembers your cookie preferences so we don't ask again on every visit. Set for 1 year, or until you clear your browser storage.

ANALYTICS (only if you consent)
• PostHog cookies (ph_*) — page views, feature usage, and (if separately enabled) session recording. IP addresses are anonymised. Typically expire after 1 year.

FUNCTIONAL (only if you consent)
• AI assistant conversation state (local storage) — lets the AI assistant remember context within your session. Cleared when you close the conversation or after 30 days.
• Saved property-preference drafts (local storage) — remembers in-progress preferences before you sign in, so you don't lose them.`
  },
  {
    title: '4. How to manage your cookie preferences',
    body: `You can change your cookie preferences at any time:

• Click "Cookie Preferences" in the footer of any page
• Choose "Accept All", "Essential Only", or open "Manage Preferences" to toggle Analytics and Functional cookies individually
• Your choice is saved locally and respected on every future visit until you change it again

You can also block or delete cookies directly through your browser settings, though this may affect how well Propcinity works, particularly the AI assistant and sign-in.

Withdrawing consent is exactly as easy as giving it, in line with Section 6 DPDPA 2023 — there's no extra step or hidden menu.`
  },
  {
    title: '5. Third-party cookies',
    body: `Where we use a third-party service that sets its own cookies (currently only PostHog, under Analytics), that provider acts as our data processor and is contractually bound to only use the data for the purpose we specify — see our Privacy Policy, Section 5, for our full list of data processors.`
  },
  {
    title: '6. Changes to this policy',
    body: `We may update this Cookie Policy as our use of cookies changes. We'll update the "Last updated" date at the top of this page, and if we introduce a new category of non-essential cookie, we'll re-prompt you for consent via the cookie banner rather than relying on a prior blanket acceptance.`
  },
  {
    title: '7. Contact',
    body: `Questions about our use of cookies? Email privacy@propcinity.in. For broader data-protection queries, see the Grievance Officer details in Section 13 of our Privacy Policy.`
  },
]

export default function CookiesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--success-light)] text-[var(--success)] text-xs font-bold rounded-full">
            <Cookie className="w-3 h-3" /> Cookie Policy
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Cookie Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated: August 2026 · Effective: August 2026 · Applies to Propcinity.in and our mobile app
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">{s.title}</h2>
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)] space-y-1">
          <p>Questions? Email <a href="mailto:privacy@propcinity.in" className="text-[var(--primary)] hover:underline">privacy@propcinity.in</a></p>
          <p>
            <Link href="/privacy-policy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
            {' · '}
            <Link href="/terms-and-conditions" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
            {' · '}
            <Link href="/" className="text-[var(--primary)] hover:underline">Back to Propcinity</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
