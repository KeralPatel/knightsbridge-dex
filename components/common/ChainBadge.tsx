interface ChainBadgeProps {
  chainId: number
  size?: 'xs' | 'sm'
}

const CHAINS: Record<number, { name: string; short: string; color: string }> = {
  1: { name: 'Ethereum', short: 'ETH', color: '#627EEA' },
  8453: { name: 'Base', short: 'BASE', color: '#0052FF' },
  11155111: { name: 'Sepolia', short: 'SEP', color: '#9CA3AF' },
}

export function ChainBadge({ chainId, size = 'sm' }: ChainBadgeProps) {
  const chain = CHAINS[chainId] || { name: 'Unknown', short: '???', color: '#9CA3AF' }
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}
      bg-[#1F2A37]
    `}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chain.color }} />
      <span className="text-[#E5E7EB]">{chain.short}</span>
    </span>
  )
}
