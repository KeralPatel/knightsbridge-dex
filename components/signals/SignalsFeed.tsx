'use client'

import { useState } from 'react'
import { useSignalsFeed } from '@/hooks/useSignalsFeed'
import { SignalCard } from './SignalCard'
import { SignalFilter } from './SignalFilter'

export function SignalsFeed() {
  const [chain, setChain] = useState('')
  const [type, setType] = useState('')
  const [minStrength, setMinStrength] = useState(0)

  const { signals, isConnected, error } = useSignalsFeed({
    chain: chain || undefined,
    type: type || undefined,
    minStrength,
    maxItems: 50,
  })

  const handleFilterChange = (key: 'chain' | 'type' | 'minStrength', value: string | number) => {
    if (key === 'chain') setChain(value as string)
    else if (key === 'type') setType(value as string)
    else setMinStrength(value as number)
  }

  return (
    <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#E5E7EB]">Live Signals</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#00FFA3] live-dot' : 'bg-[#9CA3AF]'}`}
          />
          <span className="text-xs text-[#9CA3AF]">{signals.length} signals</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2.5 border-b border-[#1F2A37]">
        <SignalFilter
          chain={chain}
          type={type}
          minStrength={minStrength}
          onChange={handleFilterChange}
        />
      </div>

      {/* Signal list */}
      <div className="divide-y divide-[rgba(31,42,55,0.5)]">
        {error && (
          <div className="px-4 py-6 text-center text-xs text-[#EF4444]">
            Failed to load signals. Retrying...
          </div>
        )}
        {!error && signals.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#9CA3AF]">
            No signals match current filters
          </div>
        )}
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  )
}
