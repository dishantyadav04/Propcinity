'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'

const SECTIONS = [
  {
    title: "We're not a listings site. We're your channel partner.",
    body: `Propcinity is a real estate decision intelligence platform built for one
job: helping homebuyers in Pune choose the right property — and then
negotiating on their behalf to get it.

Most property portals make money by showing you as many listings as
possible and connecting you to multiple brokers who call within minutes. We
do the opposite. We ask what you actually need — budget, location,
priorities — and use AI to narrow thousands of options down to a curated
shortlist with a clear Match % score. Then, as your channel partner, we
negotiate directly with the developer on pricing, terms, and unit selection
on your behalf.`
  },
  {
    title: 'Why we\'re free for buyers',
    body: `Propcinity is compensated by the developer when a transaction is completed
through our platform — never by you. We disclose this openly because it's
the only honest way to describe how a free-for-buyers service stays in
business. Our incentive is to get you into the right property on the best
terms we can negotiate, because a buyer who trusts us refers other buyers.`
  },
  {
    title: 'What Match % actually means',
    body: `Every property you view carries a Match % score — a calculation based on
how closely it fits YOUR stated budget, location, BHK preference, and RERA
status. It is not a builder-reliability or project-quality rating; it's a
personal fit score, recalculated for every buyer's own criteria.`
  },
  {
    title: 'RERA verification',
    body: `We display RERA registration status for projects where available, sourced
from MahaRERA's public portal. We recommend every buyer independently
verify a project's RERA status on the MahaRERA portal before paying any
advance.`
  },
  {
    title: 'Where we operate',
    body: `Propcinity currently covers Pune, Maharashtra, with plans to expand to
additional cities as our verification and negotiation process scales.`
  },
  {
    title: 'Get in touch',
    body: `Questions, partnership inquiries, or feedback: Contact us at hello@propcinity.in.`
  },
]

export default function AboutPage() {
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
            <Users className="w-3 h-3" /> Your Channel Partner in Pune
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            About Propcinity
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Real estate decision intelligence · Channel-partner negotiation · Zero cost to buyers
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

        {/* Team section */}
        <section className="space-y-3 border-t border-[var(--border)] pt-8">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Who we are</h2>
          <div className="text-sm text-[var(--text-muted)] leading-relaxed">
            {/* TODO: Replace with real founder/advisor name, photo, and one-line bio.
                E-E-A-T signal — having zero named humans on a trust-dependent platform
                is a credibility gap. Even one real founder bio + LinkedIn link helps. */}
          </div>
        </section>

        <div className="border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)] space-y-1">
          <p>Questions? Email <a href="mailto:hello@propcinity.in" className="text-[var(--primary)] hover:underline">hello@propcinity.in</a></p>
          <p>
            <Link href="/faq" className="text-[var(--primary)] hover:underline">FAQ</Link>
            {' · '}
            <Link href="/contact" className="text-[var(--primary)] hover:underline">Contact</Link>
            {' · '}
            <Link href="/" className="text-[var(--primary)] hover:underline">Back to Propcinity</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
