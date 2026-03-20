import Link from 'next/link'
import { RiskBadge, RiskScoreBar } from './RiskBadge'
import { CountdownTimer } from './CountdownTimer'
import { ChainBadge } from '@/components/common/ChainBadge'
import { AddressTag } from '@/components/common/AddressTag'
import { Badge } from '@/components/ui/Badge'

export interface LaunchpadListing {
  id: string
  name: string
  symbol: string
  description?: string
  chainId: number
  status: 'pending' | 'live' | 'ended' | 'cancelled'
  launchAt?: string
  riskScore: number
  smartMoneyCount: number
  liquidityEth?: number
  lockDurationDays?: number
  creatorWallet: string
  tokenAddress?: string
  raiseTarget?: number
  raiseCurrent?: number
}

interface LaunchpadCardProps {
  listing: LaunchpadListing
}

export function LaunchpadCard({ listing }: LaunchpadCardProps) {
  const isLive = listing.status === 'live'
  const isPending = listing.status === 'pending'
  const progress = listing.raiseTarget && listing.raiseCurrent
    ? Math.min(100, (listing.raiseCurrent / listing.raiseTarget) * 100)
    : null

  return (
    <Link
      href={`/launchpad/${listing.id}`}
      className="block bg-[#11161D] border border-[#1F2A37] rounded-lg p-4 hover:border-[#2d3f52] transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-[#1F2A37] flex items-center justify-center text-sm font-bold text-[#9CA3AF] shrink-0">
            {listing.symbol[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#E5E7EB]">{listing.name}</span>
              <span className="text-xs text-[#9CA3AF]">${listing.symbol}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ChainBadge chainId={listing.chainId} size="xs" />
              {isLive && <Badge variant="green" size="xs" dot>LIVE</Badge>}
              {listing.status === 'ended' && <Badge variant="default" size="xs">ENDED</Badge>}
            </div>
          </div>
        </div>
        <RiskBadge score={listing.riskScore} />
      </div>

      {/* Description */}
      {listing.description && (
        <p className="text-xs text-[#9CA3AF] mb-3 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>
      )}

      {/* Risk bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
          <span>Risk Score</span>
          <span>{listing.riskScore}/100</span>
        </div>
        <RiskScoreBar score={listing.riskScore} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[#0B0F14] rounded px-2 py-1.5 text-center">
          <div className="text-xs font-semibold text-[#00FFA3] tabular-nums">
            {listing.smartMoneyCount}
          </div>
          <div className="text-[9px] text-[#9CA3AF]">Smart Wallets</div>
        </div>
        <div className="bg-[#0B0F14] rounded px-2 py-1.5 text-center">
          <div className="text-xs font-semibold text-[#E5E7EB] tabular-nums">
            {listing.liquidityEth ? `${listing.liquidityEth} ETH` : '—'}
          </div>
          <div className="text-[9px] text-[#9CA3AF]">Liquidity</div>
        </div>
        <div className="bg-[#0B0F14] rounded px-2 py-1.5 text-center">
          <div className="text-xs font-semibold text-[#E5E7EB]">
            {listing.lockDurationDays ? `${listing.lockDurationDays}d` : '—'}
          </div>
          <div className="text-[9px] text-[#9CA3AF]">Lock Duration</div>
        </div>
      </div>

      {/* Raise progress */}
      {progress !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>Raise Progress</span>
            <span>{listing.raiseCurrent?.toFixed(2)} / {listing.raiseTarget} ETH</span>
          </div>
          <div className="h-1.5 bg-[#1F2A37] rounded-full">
            <div
              className="h-full bg-[#00FFA3] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-[10px] text-[#00FFA3] mt-0.5 font-medium tabular-nums">
            {progress.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Countdown or timer */}
      {isPending && listing.launchAt && (
        <div className="border-t border-[#1F2A37] pt-3">
          <CountdownTimer targetDate={listing.launchAt} label="Launches in" />
        </div>
      )}

      {/* Dev wallet */}
      <div className="border-t border-[#1F2A37] pt-3 mt-3 flex items-center justify-between">
        <span className="text-[10px] text-[#9CA3AF]">Dev:</span>
        <AddressTag address={listing.creatorWallet} chainId={listing.chainId} chars={4} showLink={false} />
      </div>
    </Link>
  )
}
