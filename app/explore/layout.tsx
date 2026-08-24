import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Explore Properties in Pune — AI-Curated Shortlist',
  description: "Share your budget and preferences to get AI-curated Pune properties with Match % scores and RERA verification.",
  alternates: {
    canonical: canonicalUrl('/explore'),
  },
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
