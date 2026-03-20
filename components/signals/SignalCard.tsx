import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { SignalStrengthBar } from './SignalStrengthBar'
import { AddressTag } from '@/components/common/AddressTag'

interface Signal {
  id: string
  type: string
  chain: string
  token_address: string | null
  wallet_address: string | null
  title: string
  description: string | null
  strength: number
  tier_required: string
  metadata: Record<string, unknown>
  tx_hash: string | null
  created_at: string
}

interface SignalCardProps {
  signal: Signal
}

const TYPE_CONFIG: Record<string, { label: string; color: string; variant: 'green' | 'red' | 'blue' | 'yellow' }> = {
  smart_money_entry: { label: 'Smart Money', color: '#00FFA3', variant: 'green' },
  large_transfer: { label: 'Large Transfer', color: '#3B82F6', variant: 'blue' },
  insider_buy: { label: 'Insider Buy', color: '#EF4444', variant: 'red' },
  liquidity_removal: { label: 'LP Removal', color: '#EF4444', variant: 'red' },
  rug_pattern: { label: 'Rug Pattern', color: '#EF4444', variant: 'red' },
  honeypot_detected: { label: 'Honeypot', color: '#EF4444', variant: 'red' },
  dev_wallet_move: { label: 'Dev Move', color: '#F59E0B', variant: 'yellow' },
  whale_accumulation: { label: 'Whale Acc.', color: '#00FFA3', variant: 'green' },
  unusual_volume: { label: 'Unusual Vol.', color: '#F59E0B', variant: 'yellow' },
}

function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function SignalCard({ signal }: SignalCardProps) {
  const config = TYPE_CONFIG[signal.type] ?? { label: signal.type, color: '#9CA3AF', variant: 'blue' as const }
  const chainId = parseInt(signal.chain)

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-[rgba(31,42,55,0.3)] transition-colors">
      {/* Left accent */}
      <span
        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
        style={{ backgroundColor: config.color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm text-[#E5E7EB] font-medium leading-snug">{signal.title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <SignalStrengthBar strength={signal.strength} />
            <Badge variant={config.variant} size="xs">{config.label}</Badge>
          </div>
        </div>

        {signal.description && (
          <p className="text-xs text-[#9CA3AF] mb-1.5 leading-relaxed">{signal.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {signal.token_address && (
            <Link
              href={`/token/${signal.token_address}`}
              className="text-xs font-mono text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
            >
              <AddressTag address={signal.token_address} chainId={chainId} chars={4} />
            </Link>
          )}
          {signal.wallet_address && (
            <Link
              href={`/intelligence/wallet/${signal.wallet_address}`}
              className="text-xs font-mono text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
            >
              <AddressTag address={signal.wallet_address} chainId={chainId} chars={4} />
            </Link>
          )}
          <span className="text-[10px] text-[#9CA3AF]">{timeAgo(signal.created_at)}</span>
          <span className="text-[10px] text-[#9CA3AF]">
            {signal.chain === '1' ? 'ETH' : 'BASE'}
          </span>
          {signal.tier_required !== 'free' && (
            <Badge variant="blue" size="xs">{signal.tier_required.toUpperCase()}</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
