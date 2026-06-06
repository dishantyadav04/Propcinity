'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--success-light)]
            text-[var(--success)] text-xs font-bold rounded-full">
            <ShieldCheck className="w-3 h-3" /> Your data is protected
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Last updated: June 2025 · Applies to Propcinity.in and our mobile app</p>
        </div>

        {/* Content */}
        {[
          {
            title: '1. What we collect',
            body: `When you use Propcinity, we collect information you voluntarily provide: your name, phone number, email address, and your property preferences (location, budget, type). We also collect standard usage data — pages visited, features used, and device/browser type — to improve the product.

We do NOT collect your Aadhaar number, PAN, or any financial credentials. We never access your phone contacts, camera, or microphone.`
          },
          {
            title: '2. How we use it',
            body: `Your information is used solely to personalise your property search, connect you with relevant projects, and help our advisors assist you better. We do not use your data for advertising to third parties.

We may use your email or phone to send you updates about properties you have shown interest in, or to follow up on your search. You can opt out of these communications at any time by contacting us at hello@propcinity.in.`
          },
          {
            title: '3. Who we share it with',
            body: `We share your contact details (name, phone, email) with the builder or project developer only when you choose to enquire about a specific property. This is the purpose of our service — connecting serious buyers with builders.

We do not sell, rent, or trade your personal data to any third party for marketing. We may share anonymised, aggregated data (e.g. "buyers in Pune prefer 2BHK") with partners for market research — this data cannot identify you.`
          },
          {
            title: '4. Data storage & security',
            body: `Your preference data is stored locally on your device (browser localStorage) and is not transmitted to our servers unless you choose to enquire about a project. When data is sent to our servers, it is encrypted in transit using HTTPS/TLS.

We use Supabase (a trusted cloud infrastructure provider) for server-side storage, which complies with standard security practices. Server data is stored in data centres located in the Asia-Pacific region.`
          },
          {
            title: '5. Your rights',
            body: `You have the right to request deletion of any personal data we hold about you. To do this, email us at hello@propcinity.in with the subject line "Data Deletion Request". We will delete your data within 7 business days and confirm via email.

You can also clear your local preference data at any time by clearing your browser's localStorage or using the "Reset Preferences" option in your profile settings.`
          },
          {
            title: '6. Cookies',
            body: `Propcinity uses minimal cookies — only those required for the site to function correctly (session management, security). We do not use advertising cookies or third-party tracking pixels. We use PostHog for product analytics, which is configured in privacy-friendly mode with IP anonymisation enabled.`
          },
          {
            title: "7. Children's privacy",
            body: `Propcinity is intended for adults (18+) making property decisions. We do not knowingly collect data from anyone under 18. If you believe a minor has provided us personal information, please contact us at hello@propcinity.in.`
          },
          {
            title: '8. Changes to this policy',
            body: `We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date above and notify registered users via email for material changes. Continued use of Propcinity after changes constitutes acceptance of the updated policy.`
          },
          {
            title: '9. Contact us',
            body: `For any privacy-related questions, requests, or concerns, contact us at:\n\nhello@propcinity.in\nPropcinity, Pune, Maharashtra, India`
          },
        ].map(section => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}>
              {section.title}
            </h2>
            <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {section.body}
            </div>
          </section>
        ))}

        {/* Footer links */}
        <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">© 2025 Propcinity · Zero brokerage, always.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/terms" className="text-[var(--primary)] font-semibold hover:underline">
              Terms & Conditions →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
