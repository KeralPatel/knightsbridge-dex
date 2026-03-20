import { AddressTag } from '@/components/common/AddressTag'
import { ChainBadge } from '@/components/common/ChainBadge'
import { Badge } from '@/components/ui/Badge'

interface TokenHeaderBarProps {
  name: string
  symbol: string
  address: string
  chainId: number
  priceUsd: number | null
  priceChange24h: number | null
  volume24hUsd: number | null
  marketCapUsd: number | null
  liquidityUsd: number | null
  isVerified: boolean
  isHoneypot: boolean | null
  riskScore: number | null
}

function formatCompact(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(2)}`
}

export function TokenHeaderBar({
  name,
  symbol,
  address,
  chainId,
  priceUsd,
  priceChange24h,
  volume24hUsd,
  marketCapUsd,
  liquidityUsd,
  isVerified,
  isHoneypot,
  riskScore,
}: TokenHeaderBarProps) {
  const changePositive = (priceChange24h ?? 0) >= 0

  return (
    <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg px-4 py-3">
      <div className="flex items-start justify-between flex-wrap gap-3">
        {/* Left: token identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F2A37] rounded-full flex items-center justify-center text-sm font-bold text-[#E5E7EB]">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-semibold text-[#E5E7EB]">{name}</span>
              <span className="text-sm text-[#9CA3AF] font-mono">{symbol}</span>
              <ChainBadge chainId={chainId} size="xs" />
              {isVerified && <Badge variant="green" size="xs">Verified</Badge>}
              {isHoneypot && <Badge variant="red" size="xs">Honeypot</Badge>}
              {riskScore !== null && riskScore >= 75 && (
                <Badge variant="red" size="xs">High Risk</Badge>
              )}
            </div>
            <AddressTag address={address} chainId={chainId} chars={6} />
          </div>
        </div>

        {/* Right: price + stats */}
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-xl font-semibold tabular-nums text-[#E5E7EB]">
              {priceUsd !== null ? `$${priceUsd < 0.0001 ? priceUsd.toExponential(4) : priceUsd.toFixed(6)}` : '—'}
            </div>
            {priceChange24h !== null && (
              <div className={`text-xs tabular-nums font-medium ${changePositive ? 'text-[#00FFA3]' : 'text-[#EF4444]'}`}>
                {changePositive ? '+' : ''}{priceChange24h.toFixed(2)}% 24h
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <div className="text-[#9CA3AF] uppercase tracking-wide mb-0.5">Market Cap</div>
              <div className="tabular-nums font-medium text-[#E5E7EB]">
                {marketCapUsd !== null ? formatCompact(marketCapUsd) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[#9CA3AF] uppercase tracking-wide mb-0.5">Volume 24h</div>
              <div className="tabular-nums font-medium text-[#E5E7EB]">
                {volume24hUsd !== null ? formatCompact(volume24hUsd) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[#9CA3AF] uppercase tracking-wide mb-0.5">Liquidity</div>
              <div className="tabular-nums font-medium text-[#E5E7EB]">
                {liquidityUsd !== null ? formatCompact(liquidityUsd) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
