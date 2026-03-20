'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { TradingPanel } from '@/components/layout/TradingPanel'
import { MobileNav } from '@/components/layout/MobileNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area — full width on mobile, offset on desktop */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-[240px]">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          {/* Page content — extra bottom padding on mobile for the nav bar */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>

          {/* Right trading panel — desktop only */}
          <div className="hidden lg:block">
            <TradingPanel />
          </div>
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  )
}
