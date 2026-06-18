import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Propcinity',
  description: 'Expert guides, neighborhood insights, and homebuying advice for Pune real estate — from your buyer-side channel partner.',
}

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children
}
