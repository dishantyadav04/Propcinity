'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, HelpCircle } from 'lucide-react'

const FAQ_ITEMS = [
  {
    question: 'Is Propcinity really free for buyers?',
    answer: `Yes. Propcinity charges buyers nothing. We are compensated by the developer
when a purchase is completed through our platform — fully disclosed in our
Terms & Conditions.`,
  },
  {
    question: 'Is Propcinity a broker?',
    answer: `Propcinity operates as a real estate channel partner. We negotiate with
developers directly on your behalf for pricing, terms, and unit selection
throughout your property search and purchase process.`,
  },
  {
    question: 'How is Propcinity different from sites like 99acres or Housing.com?',
    answer: `Most property portals show hundreds of listings and connect you to multiple
brokers immediately. Propcinity curates a shortlist based on your stated
preferences, shows a Match % for each property, and negotiates on your
behalf as your channel partner — instead of leaving you to deal with
multiple brokers alone.`,
  },
  {
    question: 'What does "Match %" mean?',
    answer: `Match % is a personal fit score for each property, based on how closely it
matches YOUR stated budget, location, BHK preference, property type, and
RERA status. It updates based on your own criteria — it is not a rating of
builder reliability or project quality.`,
  },
  {
    question: 'Does Propcinity verify RERA registration?',
    answer: `Yes. We display RERA registration numbers for projects where available,
sourced from MahaRERA's public portal. We recommend every buyer verify a
project's RERA status directly on the MahaRERA portal before paying any
advance.`,
  },
  {
    question: 'Which cities does Propcinity cover?',
    answer: `Propcinity currently operates in Pune, Maharashtra, with plans to expand to
additional cities.`,
  },
  {
    question: "How does Propcinity's AI assistant work?",
    answer: `Propcinity's AI assistant answers questions about specific properties using
RERA data and publicly available project details, in plain language,
instead of requiring you to dig through brochures.`,
  },
  {
    question: 'Will Propcinity negotiate the price for me?',
    answer: `Yes. As your channel partner, Propcinity negotiates directly with the
developer on pricing, terms, and unit selection on your behalf, at no cost
to you.`,
  },
  {
    question: 'How do I contact Propcinity?',
    answer: `Email us at hello@propcinity.in or visit our Contact page.`,
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_ITEMS.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer.replace(/\n/g, ' '),
    },
  })),
}

export default function FaqPage() {
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
            <HelpCircle className="w-3 h-3" /> Got Questions?
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Everything you need to know about Propcinity, Match %, and how we work.
          </p>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none hover:bg-[var(--surface-raised)] transition-colors list-none">
                <h2 className="text-sm font-bold text-[var(--text-primary)] pr-4">
                  {item.question}
                </h2>
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[var(--text-muted)] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {item.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)] space-y-1">
          <p>More questions? Email <a href="mailto:hello@propcinity.in" className="text-[var(--primary)] hover:underline">hello@propcinity.in</a></p>
          <p>
            <Link href="/about" className="text-[var(--primary)] hover:underline">About Propcinity</Link>
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
