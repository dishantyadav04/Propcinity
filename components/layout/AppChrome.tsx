'use client'

import { usePathname } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'

// Routes that render their own full-height, chrome-free experience —
// no header, no bottom nav, no footer at all.
const CHROME_HIDDEN_PREFIXES = ['/auth', '/admin']

// Routes that keep the header + bottom nav for navigation, but skip the
// full marketing footer because it doesn't fit a full-height, fixed-input
// layout like the AI chat screen.
const FOOTER_HIDDEN_PREFIXES = ['/auth', '/ai-chat']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome = matchesPrefix(pathname, CHROME_HIDDEN_PREFIXES)
  const hideFooter = hideChrome || matchesPrefix(pathname, FOOTER_HIDDEN_PREFIXES)
  const isAIChat = matchesPrefix(pathname, ['/ai-chat'])

  return (
    <>
      {!hideChrome && <TopHeader />}
      {isAIChat ? (
        <main className="fixed top-16 left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-0 z-10 overflow-hidden flex flex-col bg-[var(--background)]">
          {children}
        </main>
      ) : (
        <main className={hideChrome ? 'min-h-screen' : 'min-h-screen pt-16'}>
          {children}
        </main>
      )}
      {!hideChrome && <BottomNav />}
      {!hideFooter && <Footer />}
    </>
  )
}
