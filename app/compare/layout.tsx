import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Compare Properties Side by Side — Propcinity',
  description: 'Compare shortlisted properties by Match %, price, RERA status, amenities, and construction progress in one view.',
  alternates: {
    canonical: canonicalUrl('/compare'),
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
