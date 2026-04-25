import type { Metadata, Viewport } from 'next'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import TopHeader from '@/components/layout/TopHeader'
import BottomNav from '@/components/layout/BottomNav'
import PageTransition from '@/components/ui/PageTransition'
import ClientLayoutExtras from '@/components/layout/ClientLayoutExtras'

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-display'
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-body'
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'PropIQ | Premium Real Estate Intelligence',
  description: 'Zero brokerage. Verified insights. AI-powered property matches.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-[var(--background)] text-[var(--text-primary)] antialiased">
        <TopHeader />
        <main className="min-h-screen pb-40 md:pb-24 md:pt-0">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <BottomNav />
        <ClientLayoutExtras />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
