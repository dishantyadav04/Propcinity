'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scale } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Who we are',
    body: `Propcinity ("Company", "we", "us", "our") is a buyer-side real estate intelligence platform operated from Pune, Maharashtra, India. Our website is propcinity.in.

By accessing or using Propcinity, you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of the platform immediately.`
  },
  {
    title: '2. Eligibility',
    body: `You must be at least 18 years of age and legally capable of entering into contracts under Indian law to use Propcinity. By using our platform, you represent and warrant that you meet this requirement.

You must provide accurate, complete, and current information when registering. You are responsible for maintaining the confidentiality of your account credentials.`
  },
  {
    title: '3. Nature of our service',
    body: `Propcinity is a real estate channel partner platform. We:

• Curate and present residential real estate projects in Pune (and expanding markets)
• Use AI to match properties to your stated preferences (your "Match %")
• Act as your channel partner with RERA-registered developers — including
  negotiating on your behalf for pricing, terms, and unit selection
• Provide this service at zero cost to buyers

Propcinity operates as a channel partner to real estate developers. We
negotiate with developers on your behalf throughout your property search and
purchase process. You never pay Propcinity anything — we are compensated
solely by the developer once a transaction is completed through our platform.

All property data on our platform — including prices, configurations,
possession dates, and RERA numbers — is sourced from developers or public
sources. You must independently verify all information before making any
purchase decision.`
  },
  {
    title: '4. Zero brokerage commitment',
    body: `Buyers pay zero brokerage, consultation fee, or advisory fee through Propcinity. This is our core promise.

Our business model: We earn a referral commission from the developer when a transaction is completed through our platform. This arrangement is fully disclosed.

This commercial relationship does not compromise our buyer-first advisory commitment. We will always recommend the right property over the most commercially advantageous one for us. If you believe a recommendation is commercially biased, email us at hello@propcinity.in.`
  },
  {
    title: '5. Lead submission and developer contact',
    body: `When you submit an enquiry or click "Contact Builder" for a specific project, you explicitly consent to:

• Propcinity sharing your name, phone number, and email with the developer of that project
• The developer or their representatives contacting you via phone, WhatsApp, SMS, or email about that project

Propcinity is not responsible for the conduct, representations, or omissions of third-party developers. Any commitments made by a developer are solely between you and that developer.

You may request removal from a developer's contact list by emailing hello@propcinity.in.`
  },
  {
    title: '6. AI recommendations and Match %',
    body: `Our AI Match % and property recommendations are algorithmic assessments
based on:

• Preferences you provide (location, budget, BHK, property type)
• Publicly available project data and RERA registration status

IMPORTANT DISCLAIMER: Match % is an informational tool to help your
decision-making based on YOUR stated preferences. It is NOT an assessment of
builder reliability, project quality, or investment merit, and is not a
guarantee of any outcome.

These recommendations are NOT:
• Professional legal advice
• Architectural or structural assessments
• Financial investment advice
• Guarantees of property quality, possession timeline, or appreciation

You must engage your own legal, financial, and technical advisors before committing to any property purchase. Propcinity is not liable for decisions made based on AI recommendations.`
  },
  {
    title: '7. RERA and legal compliance',
    body: `We display RERA registration numbers for projects where available and sourced from MahaRERA (maharera.mahaonline.gov.in). We encourage all users to verify project RERA status directly on the MahaRERA portal before making any decision.

Projects labelled "RERA Pending" are listed for informational awareness only — you should not pay any advance or booking amount for a project that does not have valid RERA registration, as per RERA Act, 2016.`
  },
  {
    title: '8. User conduct',
    body: `You agree NOT to:

• Use Propcinity to scrape, harvest, or extract property data systematically
• Reverse-engineer, decompile, or attempt to access our AI models or databases
• Create fake accounts or submit false enquiries
• Use our platform for any unlawful purpose
• Harass, impersonate, or harm other users or our staff
• Post or transmit malicious code

Violation of these terms may result in immediate account termination and legal action.`
  },
  {
    title: '9. Intellectual property',
    body: `All content on Propcinity — including but not limited to the brand, logo, design system, AI model outputs, property curation methodology, Match % algorithm, editorial copy, and software — is owned by Propcinity or licensed to us.

You are granted a limited, non-exclusive, non-transferable licence to use the platform for personal property search purposes only. No other rights are granted.

You may not reproduce, redistribute, republish, or create derivative works from any Propcinity content without prior written permission.`
  },
  {
    title: '10. Payments (if applicable)',
    body: `Propcinity is currently free for buyers. If we introduce paid features (e.g. premium reports, verified listings), the following applies:

• All payments are processed via Razorpay, a PCI-DSS compliant payment gateway
• We do not store your card or bank account details
• Refunds for digital services will be evaluated case-by-case within 7 business days of request
• Email payments@propcinity.in for any payment disputes`
  },
  {
    title: '11. Limitation of liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

Propcinity is not liable for:
• Any loss or damage arising from your reliance on property data, AI scores, or recommendations on this platform
• Any acts or omissions of third-party developers
• Loss of profit, opportunity, or investment value from any property transaction
• Any data breach caused by third-party service providers despite reasonable security measures
• Interruptions to service, downtime, or data loss

Our maximum aggregate liability to you for any claim arising from your use of Propcinity shall not exceed ₹5,000 (Indian Rupees Five Thousand only).

Nothing in these terms excludes liability for fraud, death, or personal injury caused by our negligence.`
  },
  {
    title: '12. Privacy',
    body: `Your use of Propcinity is also governed by our Privacy Policy and our Cookie Policy, both incorporated into these Terms by reference. Please read them at propcinity.in/privacy and propcinity.in/cookies.

Under India's Digital Personal Data Protection Act, 2023, Propcinity acts as a "Data Fiduciary" and you as a "Data Principal." Your rights as a Data Principal — including access, correction, erasure, grievance redressal, and nomination — are set out in full in our Privacy Policy.`
  },
  {
    title: '13. Termination',
    body: `We reserve the right to suspend or terminate your account at any time if you breach these Terms. You may delete your account at any time via your profile settings or by emailing hello@propcinity.in.

Upon termination, your right to use the platform ceases. We retain your data as described in our Privacy Policy.`
  },
  {
    title: '14. Governing law and dispute resolution',
    body: `These Terms are governed by and construed in accordance with the laws of India.

Any dispute, controversy, or claim arising out of or in connection with these Terms or your use of Propcinity shall first be attempted to be resolved through good-faith negotiation within 30 days of written notice.

If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra, India.

For consumer disputes, you may also approach the appropriate Consumer Forum under the Consumer Protection Act, 2019.`
  },
  {
    title: '15. Amendments',
    body: `We may update these Terms at any time. We will update the "Last updated" date on this page. For material changes, we will notify registered users via email at least 7 days before the effective date. Continued use of Propcinity after the effective date constitutes acceptance of the updated Terms.`
  },
  {
    title: '16. Contact',
    body: `For any questions about these Terms:

Email: legal@propcinity.in
Response time: within 3 business days

For data-protection-specific grievances under the DPDPA 2023, contact our Grievance Officer directly — see Section 13 of our Privacy Policy for full details.

Propcinity, Pune, Maharashtra, India`
  },
]

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold rounded-full">
            <Scale className="w-3 h-3" /> Governed by Indian Law
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Terms & Conditions
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
          <p>Questions? Email <a href="mailto:legal@propcinity.in" className="text-[var(--primary)] hover:underline">legal@propcinity.in</a></p>
          <p>
            <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
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
// ✅ TASK 4 DONE
