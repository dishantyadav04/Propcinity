'use client'

import { useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col md:flex-row md:h-dvh md:overflow-hidden bg-[var(--background)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 md:min-h-0">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 md:min-h-0 md:overflow-y-auto md:overscroll-contain">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
