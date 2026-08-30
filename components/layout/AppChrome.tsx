'use client'

import { usePathname } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'

// Routes that render their own full-height, chrome-free experience.
const CHROME_HIDDEN_PREFIXES = ['/auth', '/ai-chat']

function isChromeHidden(pathname: string) {
  return CHROME_HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome = isChromeHidden(pathname)

  return (
    <>
      {!hideChrome && <TopHeader />}
      <main className={hideChrome ? 'min-h-screen' : 'min-h-screen pt-0'}>
        {children}
      </main>
      {!hideChrome && <BottomNav />}
      {!hideChrome && <Footer />}
    </>
  )
}
