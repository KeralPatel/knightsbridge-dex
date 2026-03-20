import { RugScoreGauge } from './RugScoreGauge'
import { AddressTag } from '@/components/common/AddressTag'
import { ChainBadge } from '@/components/common/ChainBadge'
import { Badge } from '@/components/ui/Badge'

interface WalletProfileData {
  address: string
  chainId: number
  label?: string | null
  isSmartMoney: boolean
  isDevWallet: boolean
  totalPnlUsd: number
  winRate: number
  txCount: number
  riskScore: number
  firstSeenAt?: string
  lastActiveAt?: string
  cluster?: { id: number; label?: string; behaviorTags: string[] }
  tags?: string[]
}

interface WalletProfileProps {
  wallet: WalletProfileData
}

export function WalletProfile({ wallet }: WalletProfileProps) {
  return (
    <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {wallet.label && <span className="text-base font-semibold text-[#E5E7EB]">{wallet.label}</span>}
            {wallet.isSmartMoney && <Badge variant="green" size="sm">Smart Money</Badge>}
            {wallet.isDevWallet && <Badge variant="red" size="sm">Dev Wallet</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <AddressTag address={wallet.address} chainId={wallet.chainId} chars={6} />
            <ChainBadge chainId={wallet.chainId} size="xs" />
          </div>
        </div>
        <RugScoreGauge score={wallet.riskScore} size={80} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#0B0F14] border border-[#1F2A37] rounded p-3 text-center">
          <div className={`text-lg font-semibold tabular-nums ${wallet.totalPnlUsd >= 0 ? 'text-[#00FFA3]' : 'text-[#EF4444]'}`}>
            {wallet.totalPnlUsd >= 0 ? '+' : ''}${Math.abs(wallet.totalPnlUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">Total PnL</div>
        </div>
        <div className="bg-[#0B0F14] border border-[#1F2A37] rounded p-3 text-center">
          <div className="text-lg font-semibold text-[#E5E7EB] tabular-nums">
            {(wallet.winRate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">Win Rate</div>
        </div>
        <div className="bg-[#0B0F14] border border-[#1F2A37] rounded p-3 text-center">
          <div className="text-lg font-semibold text-[#E5E7EB] tabular-nums">
            {wallet.txCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide">Total Trades</div>
        </div>
      </div>

      {/* Cluster info */}
      {wallet.cluster && (
        <div className="bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.2)] rounded p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[#3B82F6] font-semibold">Cluster #{wallet.cluster.id}</span>
            {wallet.cluster.label && <span className="text-xs text-[#9CA3AF]">— {wallet.cluster.label}</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {wallet.cluster.behaviorTags.map((tag) => (
              <Badge key={tag} variant="blue" size="xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      <div className="space-y-2 text-xs">
        {wallet.firstSeenAt && (
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">First Seen</span>
            <span className="text-[#E5E7EB]">{new Date(wallet.firstSeenAt).toLocaleDateString()}</span>
          </div>
        )}
        {wallet.lastActiveAt && (
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Last Active</span>
            <span className="text-[#E5E7EB]">{new Date(wallet.lastActiveAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
