import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contact Propcinity — Get in Touch',
  description: 'Have a question, feedback, or partnership inquiry about Pune real estate? Message the Propcinity team and we\'ll respond within 24 hours.',
  alternates: {
    canonical: canonicalUrl('/contact'),
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
