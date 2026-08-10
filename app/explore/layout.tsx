import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Explore Properties in Pune — AI-Curated Shortlist',
  description: "Tell us your budget and preferences. Propcinity's AI narrows thousands of Pune listings to a curated shortlist with Match % scoring and RERA verification.",
  alternates: {
    canonical: canonicalUrl('/explore'),
  },
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
