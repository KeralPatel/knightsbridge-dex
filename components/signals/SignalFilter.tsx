'use client'

interface SignalFilterProps {
  chain: string
  type: string
  minStrength: number
  onChange: (key: 'chain' | 'type' | 'minStrength', value: string | number) => void
}

const SIGNAL_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'smart_money_entry', label: 'Smart Money' },
  { value: 'large_transfer', label: 'Large Transfer' },
  { value: 'insider_buy', label: 'Insider Buy' },
  { value: 'liquidity_removal', label: 'LP Removal' },
  { value: 'rug_pattern', label: 'Rug Pattern' },
  { value: 'whale_accumulation', label: 'Whale Acc.' },
  { value: 'unusual_volume', label: 'Unusual Vol.' },
]

const CHAINS = [
  { value: '', label: 'All Chains' },
  { value: '1', label: 'Ethereum' },
  { value: '8453', label: 'Base' },
]

export function SignalFilter({ chain, type, minStrength, onChange }: SignalFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Chain filter */}
      <select
        value={chain}
        onChange={(e) => onChange('chain', e.target.value)}
        className="bg-[#11161D] border border-[#1F2A37] rounded-lg px-3 py-2 text-xs text-[#E5E7EB] focus:border-[#00FFA3] focus:outline-none"
      >
        {CHAINS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={type}
        onChange={(e) => onChange('type', e.target.value)}
        className="bg-[#11161D] border border-[#1F2A37] rounded-lg px-3 py-2 text-xs text-[#E5E7EB] focus:border-[#00FFA3] focus:outline-none"
      >
        {SIGNAL_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {/* Min strength */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#9CA3AF]">Min strength</span>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={minStrength}
          onChange={(e) => onChange('minStrength', parseInt(e.target.value))}
          className="w-24 accent-[#00FFA3]"
        />
        <span className="text-xs tabular-nums text-[#E5E7EB] w-6">{minStrength}</span>
      </div>
    </div>
  )
}
