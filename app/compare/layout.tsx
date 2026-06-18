import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Properties Side by Side — Propcinity',
  description: 'Compare Match %, price, RERA status, amenities, and construction progress across your shortlisted Pune properties in one view.',
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
