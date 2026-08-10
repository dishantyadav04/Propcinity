import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Cookie Policy — Propcinity',
  description: 'The cookies and storage keys Propcinity uses, why we use them, and how to manage your cookie preferences.',
  alternates: {
    canonical: canonicalUrl('/cookies'),
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
