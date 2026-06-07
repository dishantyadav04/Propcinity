'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scale } from 'lucide-react'

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-light)]
            text-[var(--primary)] text-xs font-bold rounded-full">
            <Scale className="w-3 h-3" /> Plain language, no legalese
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}>
            Terms & Conditions
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Last updated: June 2025 · Applies to Propcinity.in and our mobile app</p>
        </div>

        {[
          {
            title: '1. Who we are',
            body: `Propcinity is a buyer-side real estate advisory platform based in Pune, India. We help homebuyers find, evaluate, and choose the right property — at zero cost to the buyer. Propcinity earns a referral fee from builders when a buyer transacts through us.`
          },
          {
            title: '2. Using Propcinity',
            body: `By using this platform, you agree to these terms. You must be 18 years or older to use Propcinity. You agree to provide accurate information about yourself and your property requirements.

You may use Propcinity only for lawful purposes and only to find property for genuine personal or investment use. You may not use our platform to scrape data, reverse-engineer our AI, or misrepresent your intent.`
          },
          {
            title: '3. Our service',
            body: `Propcinity provides information, AI-assisted recommendations, and advisory services to help you make informed property decisions. We do not act as a legal representative, financial advisor, or broker in the traditional sense.

Property data, trust scores, and AI recommendations on our platform are informational. You must independently verify all property details, RERA registration, builder credentials, and legal documents before making any purchase decision.`
          },
          {
            title: '4. Zero brokerage commitment',
            body: `We commit that buyers pay zero brokerage or advisory fee through Propcinity. Our revenue comes from builders who pay us a referral commission when a transaction is completed. This commercial relationship does not compromise our commitment to buyer-first advice — we will always recommend the right property over the most profitable one.`
          },
          {
            title: '5. Lead submission',
            body: `When you submit an enquiry for a specific project, you consent to us sharing your contact details (name, phone, email) with the developer of that project. The developer may contact you directly to schedule site visits or discuss the project. Propcinity is not responsible for the conduct of third-party developers.`
          },
          {
            title: '6. AI recommendations',
            body: `Our AI-powered match scores and recommendations are based on the preferences you provide. They are meant to assist your decision — not replace your judgment or professional due diligence. Propcinity does not guarantee that any recommended property will suit your needs or appreciate in value.`
          },
          {
            title: '7. Intellectual property',
            body: `All content on Propcinity — including project data, trust scores, design, and copy — is owned by Propcinity or licensed to us. You may not reproduce, republish, or distribute our content without written permission.`
          },
          {
            title: '8. Limitation of liability',
            body: `Propcinity is not liable for any loss or damage arising from your reliance on information provided on this platform, decisions made based on our recommendations, or the conduct of third-party builders or developers.

Our total liability to you for any claim shall not exceed ₹1,000.`
          },
          {
            title: '9. Governing law',
            body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra.`
          },
          {
            title: '10. Changes to terms',
            body: `We may update these terms at any time. Continued use of Propcinity after changes means you accept the updated terms. We will notify registered users of material changes via email.`
          },
          {
            title: '11. Contact',
            body: `For questions about these terms:\n\nhello@propcinity.in\nPropcinity, Pune, Maharashtra, India`
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

        {/* Footer */}
        <div className="pt-8 border-t border-[var(--border)] space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} Propcinity. All rights reserved.
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
            Propcinity, Pune, Maharashtra, India &middot; hello@propcinity.in
          </p>
        </div>
      </main>
    </div>
  )
}
