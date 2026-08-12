'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Who we are',
    body: `Propcinity ("we", "us", "our", or "Data Fiduciary" under India's Digital Personal Data Protection Act, 2023) is a buyer-side real estate intelligence platform operated from Pune, Maharashtra, India. Our website is located at https://propcinity.in.

Under the DPDPA 2023, when we determine the purpose and means of processing your personal data, we act as a "Data Fiduciary" and you act as a "Data Principal."

For all data-related queries, contact us at: privacy@propcinity.in`
  },
  {
    title: '2. Scope of this policy',
    body: `This Privacy Policy applies to all personal data collected when you:
• Visit propcinity.in or use our mobile application
• Create an account or sign in via Google or Facebook
• Submit property enquiries or contact forms
• Use our AI assistant, property comparison, or recommendation features

This policy is written to comply with India's Digital Personal Data Protection Act, 2023 (DPDPA 2023) and its accompanying Rules. Read together with our Cookie Policy (propcinity.in/cookies), which covers cookies and similar tracking technologies in more detail.`
  },
  {
    title: '3. Consent notice — what we collect, and why (itemized, as required by Section 6 DPDPA)',
    body: `Before or at the time we ask for your consent, here is exactly what we collect and the specified purpose for each category ("data minimisation" — we do not collect more than is necessary for these purposes):

IDENTITY & CONTACT DATA
• Full name, email address, phone number — collected when you register or submit a property enquiry. Purpose: to create your account, personalise your experience, and connect you with the relevant developer/advisor.

AUTHENTICATION DATA (OAuth)
• When you sign in with Google or Facebook, we receive your name, email, and profile photo from those providers. We never receive your Google or Facebook password.
• We separately ask for your phone number after OAuth sign-in — purpose: enabling advisor-to-buyer calls. This step is optional and skippable.

PROPERTY PREFERENCE DATA
• Preferred location, budget range, BHK/property type, timeline, and purpose (self-use/investment). Purpose: powering our AI-based Match % and recommendation engine. Stored locally on your device first, synced to our servers only once you're signed in.

USAGE & ANALYTICS DATA
• Pages visited, features used, session duration, device/browser type. Purpose: understanding product usage and improving the platform. Collected via PostHog only if you consent to Analytics cookies (see our Cookie Policy) — IP anonymisation is enabled.

AI ASSISTANT DATA
• The text of questions you ask our AI assistant, and the preference data used to generate recommendations. Purpose: generating property matches and answering your questions. This data is sent to OpenAI (our AI processing sub-processor — see Section 5) solely to generate a response; it is not used by OpenAI to train their models under our commercial API terms with them.

TECHNICAL & SECURITY DATA
• IP address, browser/device fingerprint, and error/crash context. Purpose: fraud prevention, rate-limiting abuse of our platform, and diagnosing bugs via Sentry (our error-monitoring sub-processor). Retained only as long as needed for these purposes (see Section 6).

COMMUNICATION DATA
• Content of messages you send us via the contact form or email. Purpose: responding to your query and improving support quality.

WHAT WE DO NOT COLLECT
• Aadhaar, PAN, passport, or other government ID numbers
• Financial credentials, card numbers, or bank account details
• Real-time GPS location
• Access to your phone contacts, camera, or microphone`
  },
  {
    title: '4. Legal basis for processing (DPDPA 2023, Sections 6 & 7)',
    body: `Under India's DPDPA 2023, we may only process your personal data where you have given consent, or where one of the specific "certain legitimate uses" listed in Section 7 of the Act applies. We rely on:

• CONSENT (Section 6) — for Analytics and Functional cookies, and for any marketing communications. Your consent must be, and is, free, specific, informed, unconditional, and given through a clear affirmative action (no pre-ticked boxes) — see our Cookie Policy for how you grant or withdraw this. You may withdraw consent at any time, as easily as you gave it, without affecting the lawfulness of processing carried out before withdrawal.

• VOLUNTARILY PROVIDED DATA FOR A SPECIFIED PURPOSE (Section 7(a)) — when you submit a property enquiry, you voluntarily provide your name, phone, and email for the specified purpose of being connected with that project's developer, and haven't indicated you don't consent to that specific use.

• LEGAL OBLIGATION — where Indian law requires us to retain certain records (e.g. the Information Technology Act, 2000, or applicable tax/GST record-keeping requirements).

We do not process your personal data on any ground beyond what DPDPA 2023 permits, and we do not use a GDPR-style open-ended "legitimate interest" ground that Indian law does not recognise.`
  },
  {
    title: '5. How we share your data — our data processors',
    body: `We share personal data only in the following limited circumstances:

WITH BUILDERS / PROJECT DEVELOPERS
When you submit an enquiry about a specific property, we share your name, phone number, and email with that project's developer. This is the core purpose of our service, and only happens when you actively choose to enquire — we do not share your details with any developer you haven't shown interest in.

WITH OUR DATA PROCESSORS
We use the following processors to operate Propcinity. Each is bound by contract to process your data only on our instructions and only for the purpose we specify:

• Supabase — database, authentication, and file storage infrastructure
• Cloudflare (R2) — image and document storage / CDN
• OpenAI — processes AI assistant questions and preference text solely to generate responses and recommendations; not used to train OpenAI's models under our API agreement with them
• Sentry — error monitoring and crash diagnostics (may capture IP address and device/browser context when an error occurs)
• PostHog — product analytics, only if you've consented to Analytics cookies; IP anonymisation enabled
• Upstash (Redis) — short-lived rate-limiting and caching infrastructure; stores IP-derived identifiers only as long as needed to enforce rate limits (typically minutes to hours)
• Resend — transactional email delivery (e.g. account emails, enquiry confirmations)
• Razorpay — payment processing, only if and when we introduce paid features; we never store your card or bank details ourselves

WE DO NOT:
• Sell your personal data to any third party
• Share your data with advertisers or ad networks
• Use your data for purposes beyond what's described in this policy`
  },
  {
    title: '6. Cross-border data transfer',
    body: `Some of our processors (OpenAI, Sentry, and parts of Supabase's infrastructure) may process data outside India. Under Section 16 of the DPDPA 2023, transfer of personal data outside India is permitted unless the Central Government has specifically restricted transfer to that country by notification. We only work with processors in jurisdictions that are not subject to any such restriction, and each is bound by contractual data protection obligations.`
  },
  {
    title: '7. Data retention (storage limitation)',
    body: `In line with Section 8(7) DPDPA 2023, we retain personal data only for as long as necessary for the purpose it was collected, or as required by law:

• Account data — retained while your account is active, and for 90 days after deletion, to allow you to reverse an accidental deletion
• Enquiry records — retained for 3 years (business records)
• Analytics data — retained for 12 months, then aggregated and anonymised
• AI assistant conversation data — retained for 30 days, then deleted
• Rate-limiting / security identifiers (Upstash) — retained for hours to days, only as long as needed to detect abuse
• Contact form messages — retained for 12 months

You may request earlier deletion at any time — see Section 9.`
  },
  {
    title: '8. Data security and breach notification',
    body: `We implement reasonable security safeguards as required under Section 8(5) DPDPA 2023 to prevent personal data breaches, including:

• Encryption of data in transit (TLS 1.2+) and at rest (AES-256)
• Role-based access control restricting production database access to authorised personnel
• Short-lived authentication tokens stored in HTTP-only cookies
• Periodic security review of our codebase and infrastructure

If a personal data breach occurs, we will notify the Data Protection Board of India and affected Data Principals as required under Section 8(6) DPDPA 2023, including what happened, the likely consequences, and the measures we've taken or propose to take.

No system is 100% secure, and we cannot guarantee absolute security, but we take these obligations seriously.`
  },
  {
    title: '9. Your rights as a Data Principal (Sections 11–14, DPDPA 2023)',
    body: `You have the following rights under the DPDPA 2023:

RIGHT TO ACCESS INFORMATION (Section 11) — You may request a summary of the personal data we hold about you, the processing activities we've undertaken with it, and the identities of other Data Fiduciaries/processors we've shared it with.

RIGHT TO CORRECTION AND ERASURE (Section 12) — You may request correction of inaccurate or incomplete data, or completion of incomplete data, or erasure of data that is no longer necessary for the purpose it was collected. We will action erasure requests within 7 business days unless we're required to retain the data by law.

RIGHT TO GRIEVANCE REDRESSAL (Section 13) — You may raise a complaint with us using the contact details in Section 13 below. We will respond within 30 days. If unresolved, you may escalate to the Data Protection Board of India.

RIGHT TO NOMINATE (Section 14) — You may nominate another individual to exercise your rights under this policy in the event of your death or incapacity. To register a nomination, email privacy@propcinity.in with the subject "Nomination Request."

RIGHT TO WITHDRAW CONSENT — You may withdraw any consent-based processing at any time via your profile settings, our Cookie Policy preferences, or by emailing us — withdrawal is as easy as giving consent, and does not affect the lawfulness of processing before withdrawal.

To exercise any right, email privacy@propcinity.in with a subject line matching your request (e.g. "Data Access Request", "Data Erasure Request", "Nomination Request").`
  },
  {
    title: "10. Children's data (Section 9, DPDPA 2023)",
    body: `Propcinity is intended exclusively for adults aged 18 and above who are capable of making property decisions. We do not knowingly collect personal data from anyone under 18, do not undertake tracking or behavioural monitoring of children, and do not serve targeted advertising directed at children, in accordance with Section 9 DPDPA 2023.

If you believe a child has provided us with their data, contact privacy@propcinity.in immediately and we will verify and delete it promptly.`
  },
  {
    title: '11. Links to third-party sites',
    body: `Our platform may link to third-party websites (e.g. the MahaRERA portal, builder websites). We are not responsible for the privacy practices of those sites. Please review their privacy policies before providing any data.`
  },
  {
    title: '12. Changes to this policy',
    body: `We may update this Privacy Policy to reflect changes in law, technology, or our practices. We will update the "Last updated" date at the top of this page, and for material changes, notify registered users via email at least 7 days before the change takes effect. Continued use of Propcinity after the effective date constitutes acceptance of the updated policy.`
  },
  {
    title: '13. Contact & Grievance Officer',
    body: `For any privacy-related queries, requests, or complaints:

Email: privacy@propcinity.in
Response time: within 3 business days

Grievance Officer (appointed as required under DPDPA 2023 and the IT Act, 2000):
Dishant Shamjeet Yadav
Email: grievance@propcinity.in
Address: Pimpri Chincwad, Pune, Maharashtra
Response time: within 30 days, as required under DPDPA 2023

If your grievance remains unresolved, you may file a complaint with the Data Protection Board of India (dataprotection.gov.in once operational) under Section 13 DPDPA 2023.`
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
            <Link href="/terms-and-conditions" className="text-[var(--primary)] hover:underline">Terms & Conditions</Link>
            {' · '}
            <Link href="/cookies" className="text-[var(--primary)] hover:underline">Cookie Policy</Link>
            {' · '}
            <Link href="/" className="text-[var(--primary)] hover:underline">Back to Propcinity</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
// ✅ TASK 3 DONE
