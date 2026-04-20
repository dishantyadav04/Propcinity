import type { Metadata } from 'next'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import TopHeader from '@/components/layout/TopHeader'
import BottomNav from '@/components/layout/BottomNav'

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-display'
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'PropIQ | Premium Real Estate Intelligence',
  description: 'Zero brokerage. Verified insights. AI-powered property matches.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jakarta.variable}`}>
      <body className="font-sans bg-[var(--background)] text-[var(--text-primary)] antialiased">
        <TopHeader />
        <main className="min-h-screen pb-20 md:pb-0">
          {children}
        </main>
        <BottomNav />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
