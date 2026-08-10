import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: "Ask Propcinity's AI About Any Property in Pune",
  description: "Get honest, data-backed answers about Pune properties using RERA data and AI — no brochures, no sales calls.",
  alternates: {
    canonical: canonicalUrl('/ai-chat'),
  },
}

export default function AIChatLayout({ children }: { children: React.ReactNode }) {
  return children
}
