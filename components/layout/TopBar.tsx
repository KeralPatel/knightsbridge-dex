'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useEthersContext } from '@/app/providers'
import { Badge } from '@/components/ui/Badge'

const CHAINS = [
  { id: 1,        name: 'Ethereum',       short: 'ETH',    color: '#627EEA' },
  { id: 8453,     name: 'Base',           short: 'BASE',   color: '#0052FF' },
  { id: 11155111, name: 'Sepolia Testnet',short: 'SEP',    color: '#F59E0B' },
]

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const { chainId, isConnected, switchChain } = useEthersContext()
  const [chainMenuOpen, setChainMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const currentChain = CHAINS.find((c) => c.id === chainId) || CHAINS[0]

  return (
    <header className="h-12 border-b border-[#1F2A37] bg-[#11161D] flex items-center justify-between px-5 sticky top-0 z-30">
      {/* Left: title */}
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold text-[#E5E7EB]">{title}</h1>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Gas price */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#9CA3AF]">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20V4a2 2 0 012-2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v4h4M9 13h6M9 17h6M9 9h2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="tabular-nums">12 gwei</span>
        </div>

        <div className="w-px h-4 bg-[#1F2A37]" />

        {/* Chain selector */}
        <div className="relative">
          <button
            onClick={() => setChainMenuOpen(!chainMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-[#1F2A37] text-xs font-medium text-[#E5E7EB] hover:border-[#2d3f52] transition-colors"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentChain.color }}
            />
            {currentChain.short}
            <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {chainMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#11161D] border border-[#1F2A37] rounded shadow-xl z-50">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    if (isConnected) switchChain(chain.id)
                    setChainMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-[#1F2A37] transition-colors text-left
                    ${chain.id === chainId ? 'text-[#00FFA3]' : 'text-[#E5E7EB]'}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chain.color }} />
                  {chain.name}
                  {chain.id === chainId && (
                    <svg className="w-3 h-3 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-[#1F2A37] text-xs text-[#E5E7EB] hover:border-[#2d3f52] transition-colors"
          >
            <div className="w-5 h-5 rounded bg-[#1F2A37] flex items-center justify-center">
              <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 110-10 5 5 0 010 10zm0 2c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z" />
              </svg>
            </div>
            <Badge variant="green" size="xs">Free</Badge>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#11161D] border border-[#1F2A37] rounded shadow-xl z-50">
              <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#E5E7EB] hover:bg-[#1F2A37] transition-colors">
                <svg className="w-3.5 h-3.5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Profile & API Keys
              </Link>
              <div className="border-t border-[#1F2A37]" />
              <button
                onClick={() => {
                  localStorage.removeItem('kbdex_token')
                  window.location.href = '/login'
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#EF4444] hover:bg-[#1F2A37] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menus */}
      {(chainMenuOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setChainMenuOpen(false); setUserMenuOpen(false) }}
        />
      )}
    </header>
  )
}
