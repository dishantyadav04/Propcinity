import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About Propcinity — Your Real Estate Channel Partner in Pune',
  description: "Propcinity uses AI to curate property matches and negotiates with developers on your behalf as your channel partner — at zero cost to buyers.",
  alternates: {
    canonical: canonicalUrl('/about'),
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
