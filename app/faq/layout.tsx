import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Propcinity',
  description: "Is Propcinity free? How does Match % work? Do you negotiate on my behalf? Get clear answers about how Propcinity's channel-partner model works.",
  alternates: {
    canonical: canonicalUrl('/faq'),
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
