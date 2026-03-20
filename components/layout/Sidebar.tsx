'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEthersContext } from '@/app/providers'
import { Button } from '@/components/ui/Button'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Launchpad',
    href: '/launchpad',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    badge: 'NEW',
  },
  {
    label: 'DEX',
    href: '/dex',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 16V4m0 0L4 7m3-3l3 3M17 8v12m0 0l3-3m-3 3l-3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Intelligence',
    href: '/intelligence',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z" />
      </svg>
    ),
  },
  {
    label: 'Signals',
    href: '/signals',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    live: true,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { address, isConnected, connect, isConnecting, disconnect } = useEthersContext()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleNavClick = () => {
    onClose?.()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-[240px] bg-[#11161D] border-r border-[#1F2A37] flex flex-col z-50
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#1F2A37] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={handleNavClick}>
            <div className="w-7 h-7 bg-[#00FFA3] rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-[#0B0F14]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#E5E7EB] leading-none">Knightsbridge</div>
              <div className="text-[10px] text-[#00FFA3] font-medium leading-tight mt-0.5">DEX INTELLIGENCE</div>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            className="md:hidden p-1 text-[#9CA3AF] hover:text-[#E5E7EB]"
            onClick={onClose}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium
                  transition-colors duration-100
                  ${isActive(item.href)
                    ? 'bg-[rgba(0,255,163,0.08)] text-[#00FFA3]'
                    : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2A37]'
                  }
                `}
              >
                <span className={isActive(item.href) ? 'text-[#00FFA3]' : 'text-[#9CA3AF]'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-semibold bg-[#00FFA3] text-[#0B0F14] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.live && (
                  <span className="flex items-center gap-1">
                    <span className="live-dot w-1.5 h-1.5 bg-[#00FFA3] rounded-full" />
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Market status */}
          <div className="mt-6 px-3">
            <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-2 font-medium">Markets</div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9CA3AF]">ETH</span>
                <span className="text-[#E5E7EB] tabular-nums font-medium">$3,412.50</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9CA3AF]">Gas</span>
                <span className="text-[#E5E7EB] tabular-nums font-medium">12 gwei</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Wallet Connect */}
        <div className="p-3 border-t border-[#1F2A37]">
          {isConnected && address ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0B0F14] rounded border border-[#1F2A37]">
                <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
                <span className="text-xs text-[#E5E7EB] font-mono tabular-nums flex-1 truncate">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="w-full text-xs text-[#9CA3AF] hover:text-[#EF4444] transition-colors text-center py-1"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={connect}
              loading={isConnecting}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 010-4h14v4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 7v13a2 2 0 002 2h14v-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 12h3v5h-3a2.5 2.5 0 010-5z" />
              </svg>
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>
    </>
  )
}
