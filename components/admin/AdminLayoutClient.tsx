'use client'

import { useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
