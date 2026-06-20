'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Who we are',
    body: `Propcinity (referred to as "we", "us", or "our") is a buyer-side real estate intelligence platform operated from Pune, Maharashtra, India. Our website is located at https://propcinity.in.

For all data-related queries, contact us at: privacy@propcinity.in`
  },
  {
    title: '2. Scope of this policy',
    body: `This Privacy Policy applies to all personal data collected when you:
• Visit propcinity.in or use our mobile application
• Create an account or sign in via Google or Facebook
• Submit property enquiries or contact forms
• Use our AI assistant or property comparison features

This policy is compliant with India's Digital Personal Data Protection Act, 2023 (DPDPA 2023) and incorporates internationally recognised privacy standards.`
  },
  {
    title: '3. What personal data we collect and why',
    body: `We collect only the minimum data necessary to provide our service ("data minimisation"):

IDENTITY & CONTACT DATA
• Full name, email address, phone number — collected when you register or enquire. Used to personalise your experience and connect you with property advisors.

AUTHENTICATION DATA (OAuth)
• When you sign in with Google or Facebook, we receive your name, email, and profile photo from those providers. We do not receive your Google or Facebook password.
• If you use Google or Facebook to sign in, we additionally ask for your phone number — this is used solely to enable advisor-to-buyer calls. You may skip this step.

PROPERTY PREFERENCE DATA
• Your preferred location, budget range, property type, and lifestyle priorities. Used to power our AI recommendations engine. Stored locally on your device and synced to our servers only when you log in.

USAGE & ANALYTICS DATA
• Pages visited, features used, session duration, device/browser type. Collected via PostHog in privacy-friendly mode (IP anonymisation ON, opt-in only via cookie consent).

COMMUNICATION DATA
• Content of messages you send us via the contact form or email. Retained for support purposes only.

WHAT WE DO NOT COLLECT
• Aadhaar, PAN, or passport numbers
• Financial credentials or bank account details
• Your location in real-time (GPS)
• Phone contacts, camera, or microphone data`
  },
  {
    title: '4. Legal basis for processing (DPDPA 2023 / GDPR)',
    body: `Under India's DPDPA 2023, we process personal data on the following grounds:

• CONSENT — Analytics cookies, marketing communications. You provide explicit consent via our cookie banner. You may withdraw consent at any time.
• CONTRACT — When you submit an enquiry, sharing your contact details with the relevant builder is necessary to fulfil your request.
• LEGITIMATE INTEREST — Platform security, fraud prevention, and product improvement using anonymised data.
• LEGAL OBLIGATION — We retain certain records where required by Indian law (e.g. IT Act 2000, GST records for transactions).`
  },
  {
    title: '5. How we share your data',
    body: `We share personal data only in the following limited circumstances:

WITH BUILDERS / PROJECT DEVELOPERS
When you choose to enquire about a specific property, we share your name, phone number, and email with that project's developer. This is the core purpose of our service. You control this — we only share when you press "Enquire" or "Contact Builder".

WITH SERVICE PROVIDERS (Data Processors)
• Supabase (Ireland/EU) — database and authentication hosting
• Resend (USA) — transactional email delivery
• PostHog (USA/EU) — product analytics, privacy mode enabled
• Razorpay (India) — payment processing for premium features, if applicable
• Cloudflare / AWS — CDN and storage infrastructure

All service providers are bound by data processing agreements and may not use your data for their own purposes.

WE DO NOT:
• Sell your personal data to any third party
• Share your data with advertisers
• Transfer data to countries without adequate data protection unless governed by standard contractual clauses`
  },
  {
    title: '6. Data retention',
    body: `We retain personal data only as long as necessary:

• Account data — retained while your account is active, and for 90 days after deletion
• Enquiry records — retained for 3 years (business records)
• Analytics data — retained for 12 months, then aggregated and anonymised
• Contact form messages — retained for 12 months

You may request earlier deletion at any time (see Section 8).`
  },
  {
    title: '7. Data security',
    body: `We implement appropriate technical and organisational measures to protect your data:

• All data in transit is encrypted using TLS 1.2+
• All data at rest is encrypted using AES-256
• Access to production databases is restricted to authorised personnel via role-based access control
• Authentication tokens are short-lived and stored in HTTP-only cookies
• We conduct periodic security reviews of our codebase and infrastructure

While we take these measures seriously, no system is 100% secure. In the event of a data breach affecting your rights, we will notify you within 72 hours as required under DPDPA 2023.`
  },
  {
    title: '8. Your rights under DPDPA 2023',
    body: `As a Data Principal under India's DPDPA 2023, you have the following rights:

RIGHT TO ACCESS — You may request a summary of the personal data we hold about you.

RIGHT TO CORRECTION — You may request correction of inaccurate or incomplete data.

RIGHT TO ERASURE — You may request deletion of your personal data. We will action this within 7 business days.

RIGHT TO GRIEVANCE REDRESSAL — You may raise a complaint with us. If unresolved within 30 days, you may escalate to the Data Protection Board of India once it is constituted.

RIGHT TO WITHDRAW CONSENT — You may withdraw any consent-based processing at any time via your profile settings or by emailing us.

To exercise any right, email: privacy@propcinity.in with the subject line matching your request (e.g. "Data Deletion Request", "Data Access Request").`
  },
  {
    title: '9. Cookies',
    body: `We use cookies in the following categories:

STRICTLY NECESSARY (always active)
• Session cookie — keeps you logged in
• Security cookie — CSRF protection

ANALYTICS (opt-in via consent banner)
• PostHog — page views, feature usage, session recording (if enabled). IP addresses are anonymised. You may opt out at any time.

We do NOT use:
• Advertising or retargeting cookies
• Third-party tracking pixels (Meta Pixel, Google Ads, etc.)

You may manage cookie preferences at any time using the cookie settings button in the footer.`
  },
  {
    title: "10. Children's privacy",
    body: `Propcinity is intended exclusively for adults aged 18 and above who are capable of making property decisions. We do not knowingly collect personal data from anyone under 18.

If you believe a child has provided us with their data, please contact privacy@propcinity.in immediately and we will delete it promptly.`
  },
  {
    title: '11. Links to third-party sites',
    body: `Our platform may link to third-party websites (e.g. RERA Maharashtra portal, builder websites). We are not responsible for the privacy practices of those sites. Please review their privacy policies before providing any data.`
  },
  {
    title: '12. Changes to this policy',
    body: `We may update this Privacy Policy from time to time to reflect changes in law, technology, or our practices. We will update the "Last updated" date at the top of this page. For material changes, we will notify registered users via email at least 7 days before the change takes effect. Continued use of Propcinity after the effective date constitutes acceptance of the updated policy.`
  },
  {
    title: '13. Contact & Grievance Officer',
    body: `For any privacy-related queries, requests, or complaints:

Email: privacy@propcinity.in
Response time: Within 3 business days

Grievance Officer (as required under DPDPA 2023 and IT Act, 2000):
[Full Name]
Email: grievance@propcinity.in
Address: [Registered address], Pune, Maharashtra
Response time: Within 30 days as per DPDPA 2023

You also have the right to lodge a complaint with the Data Protection Board of India once it is constituted under DPDPA 2023.`
  },
]

export default function PrivacyPage() {
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
            <ShieldCheck className="w-3 h-3" /> DPDPA 2023 Compliant
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated: June 2026 · Effective: June 2026 · Applies to Propcinity.in and our mobile app
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
            <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
            {' · '}
            <Link href="/" className="text-[var(--primary)] hover:underline">Back to Propcinity</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
// ✅ TASK 3 DONE
