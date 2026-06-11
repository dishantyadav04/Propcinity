import type { Metadata, Viewport } from 'next'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import TopHeader from '@/components/layout/TopHeader'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'
import PageTransition from '@/components/ui/PageTransition'
import ClientLayoutExtras from '@/components/layout/ClientLayoutExtras'

const syne = Syne({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display'
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-body'
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: {
    default: 'Propcinity — Find the Right Property',
    template: '%s | Propcinity',
  },
  description: 'AI-curated real estate in Pune. Zero brokerage. Free for buyers. Trust scores, RERA verification, and expert advisors.',
  keywords: ['real estate', 'Pune property', 'zero brokerage', 'buy flat Pune'],
  authors: [{ name: 'Propcinity' }],
  creator: 'Propcinity',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'),
  openGraph: {
    siteName: 'Propcinity',
    title: 'Propcinity — Find the Right Property',
    description: 'AI-curated real estate in Pune. Zero brokerage. Free for buyers.',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Propcinity — Find the Right Property',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Propcinity — Find the Right Property',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jakarta.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans bg-[var(--background)] text-[var(--text-primary)] antialiased">
        <TopHeader />
        <main className="min-h-screen pb-24 md:pb-0 pt-0">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <BottomNav />
        <Footer />
        <ClientLayoutExtras />
        <Toaster
          position="bottom-center"
          closeButton={true}
          duration={4000}
          toastOptions={{
            style: {
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              fontWeight: '600',
              padding: '12px 16px',
            },
            classNames: {
              closeButton: 'bg-transparent border-none text-current opacity-60 hover:opacity-100',
            },
          }}
        />
      </body>
    </html>
  )
}
