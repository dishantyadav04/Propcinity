import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy — Propcinity',
  description: 'How Propcinity collects, uses, and protects your personal data under India\'s DPDPA 2023, including what we share with developers and data processors.',
  alternates: {
    canonical: canonicalUrl('/privacy-policy'),
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
