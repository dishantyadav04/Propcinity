import type { Metadata, Viewport } from 'next'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { Toaster } from 'sonner'
import './globals.css'
import TopHeader from '@/components/layout/TopHeader'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'
import PageTransition from '@/components/ui/PageTransition'
import ClientLayoutExtras from '@/components/layout/ClientLayoutExtras'
import CookieConsentProvider from '@/components/consent/CookieConsentProvider'
import PostHogProvider from '@/components/analytics/PostHogProvider'
import PostHogPageView from '@/components/analytics/PostHogPageView'
import { Analytics } from '@vercel/analytics/next'
// ✅ TASK 1 DONE

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: {
    default: 'Propcinity — Find the Right Property in Pune',
    template: '%s | Propcinity',
  },
  description: 'AI-curated real estate in Pune. Zero brokerage. Free for buyers. AI Match % scoring, RERA verification, and a dedicated channel partner.',
  keywords: ['real estate', 'Pune property', 'zero brokerage', 'buy flat Pune'],
  authors: [{ name: 'Propcinity' }],
  creator: 'Propcinity',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'),
  openGraph: {
    siteName: 'Propcinity',
    title: 'Propcinity — Find the Right Property in Pune',
    description: 'AI-curated real estate in Pune. Zero brokerage. AI Match % scoring. Your dedicated channel partner in Pune.',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Propcinity — Find the Right Property in Pune',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Propcinity — Find the Right Property in Pune',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Propcinity",
    "url": "https://propcinity.in",
    "description": "Propcinity is a real estate channel partner platform that uses AI to curate property matches for buyers in Pune and negotiates with developers on the buyer's behalf, at no cost to buyers.",
    "areaServed": { "@type": "City", "name": "Pune" },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX", // TODO: replace with real support number
      "contactType": "customer service",
      "email": "hello@propcinity.in",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi", "Marathi"]
    }
    // TODO: add "sameAs": [...] once real social profiles exist (see Task 9)
  }

  return (
    <html lang="en" className={`${syne.variable} ${jakarta.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans bg-[var(--background)] text-[var(--text-primary)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <CookieConsentProvider>
          <PostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
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
            <Analytics />
          </PostHogProvider>
        </CookieConsentProvider>
      </body>
    </html>
  )
}
