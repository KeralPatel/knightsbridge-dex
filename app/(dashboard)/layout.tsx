import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { TradingPanel } from '@/components/layout/TradingPanel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        <TopBar />
        <div className="flex flex-1">
          {/* Page content */}
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>

          {/* Right trading panel */}
          <TradingPanel />
        </div>
      </div>
    </div>
  )
}
