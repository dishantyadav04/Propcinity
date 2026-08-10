import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Propcinity',
  description: 'The terms governing your use of Propcinity, our zero-brokerage channel-partner model, and how we work with buyers and developers in Pune.',
  alternates: {
    canonical: canonicalUrl('/terms-and-conditions'),
  },
}

export default function TermsAndConditionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
