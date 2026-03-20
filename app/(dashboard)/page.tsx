import { Suspense } from 'react'
import Link from 'next/link'
import { SkeletonCard } from '@/components/common/LoadingSkeleton'
import { Badge } from '@/components/ui/Badge'

const STAT_CARDS = [
  {
    label: 'Total Volume (24h)',
    value: '$2.4B',
    change: '+12.4%',
    positive: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Active Signals',
    value: '48',
    change: '12 critical',
    positive: false,
    danger: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Smart Money Tracked',
    value: '1,247',
    change: '+34 today',
    positive: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Tokens Launched',
    value: '23',
    change: '7 live now',
    positive: true,
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const RECENT_SIGNALS = [
  { type: 'smart_money_entry', title: '5 smart wallets accumulated TOKEN X', token: 'TOKENX', time: '2m ago', strength: 85, severity: 'high' },
  { type: 'liquidity_removal', title: 'Liquidity removed from PEPE2 pool', token: 'PEPE2', time: '8m ago', strength: 95, severity: 'critical' },
  { type: 'insider_buy', title: 'Insider exit detected on MOONCAT', token: 'MOONCAT', time: '15m ago', strength: 72, severity: 'high' },
  { type: 'whale_accumulation', title: 'Whale accumulated $1.2M DOGE2', token: 'DOGE2', time: '23m ago', strength: 60, severity: 'medium' },
  { type: 'rug_pattern', title: 'Rug pattern detected: SAFEMOON3', token: 'SAFEMOON3', time: '31m ago', strength: 98, severity: 'critical' },
]

const TOP_TOKENS = [
  { symbol: 'PEPE2', price: '$0.00000423', change: '+284%', volume: '$12.4M', risk: 78, chain: 'ETH' },
  { symbol: 'WOJAK', price: '$0.00000891', change: '+124%', volume: '$8.1M', risk: 45, chain: 'BASE' },
  { symbol: 'SHIB2', price: '$0.00000012', change: '+67%', volume: '$5.3M', risk: 62, chain: 'ETH' },
  { symbol: 'DOGE3', price: '$0.00000034', change: '+43%', volume: '$3.8M', risk: 31, chain: 'BASE' },
  { symbol: 'MOON', price: '$0.00001200', change: '-12%', volume: '$2.1M', risk: 88, chain: 'ETH' },
]

function RiskBar({ score }: { score: number }) {
  const color = score >= 76 ? '#EF4444' : score >= 51 ? '#F59E0B' : score >= 26 ? '#3B82F6' : '#00FFA3'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1F2A37] rounded-full">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs tabular-nums font-medium" style={{ color }}>{score}</span>
    </div>
  )
}

function SignalSeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: '#EF4444',
    high: '#F59E0B',
    medium: '#3B82F6',
    low: '#9CA3AF',
  }
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[severity] || '#9CA3AF' }} />
}

export default function DashboardPage() {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#E5E7EB]">Intelligence Dashboard</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Real-time on-chain intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <span className="live-dot w-2 h-2 bg-[#00FFA3] rounded-full" />
            Live
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">{card.label}</span>
              <span className={card.danger ? 'text-[#EF4444]' : 'text-[#00FFA3]'}>
                {card.icon}
              </span>
            </div>
            <div className="text-2xl font-semibold text-[#E5E7EB] tabular-nums">{card.value}</div>
            <div className={`text-xs mt-1 font-medium ${card.danger ? 'text-[#EF4444]' : card.positive ? 'text-[#00FFA3]' : 'text-[#9CA3AF]'}`}>
              {card.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Signals */}
        <div className="lg:col-span-3 bg-[#11161D] border border-[#1F2A37] rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#E5E7EB]">Live Signals</span>
              <span className="live-dot w-1.5 h-1.5 bg-[#00FFA3] rounded-full" />
            </div>
            <Link href="/signals" className="text-xs text-[#9CA3AF] hover:text-[#00FFA3] transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[rgba(31,42,55,0.5)]">
            {RECENT_SIGNALS.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                <SignalSeverityDot severity={signal.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#E5E7EB] font-medium truncate">{signal.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#9CA3AF] font-mono">{signal.token}</span>
                    <span className="text-xs text-[#9CA3AF]">{signal.time}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Badge
                    variant={signal.severity === 'critical' || signal.severity === 'high' ? 'red' : signal.severity === 'medium' ? 'blue' : 'default'}
                    size="xs"
                  >
                    {signal.strength}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tokens */}
        <div className="lg:col-span-2 bg-[#11161D] border border-[#1F2A37] rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
            <span className="text-sm font-semibold text-[#E5E7EB]">Trending Tokens</span>
            <Link href="/launchpad" className="text-xs text-[#9CA3AF] hover:text-[#00FFA3] transition-colors">
              Launchpad →
            </Link>
          </div>
          <div className="divide-y divide-[rgba(31,42,55,0.5)]">
            {TOP_TOKENS.map((token, i) => (
              <Link
                key={i}
                href={`/token/0x${i}000000000000000000000000000000000000000`}
                className="block px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#1F2A37] flex items-center justify-center text-[10px] font-semibold text-[#9CA3AF]">
                      {token.symbol[0]}
                    </div>
                    <span className="text-sm font-semibold text-[#E5E7EB]">{token.symbol}</span>
                    <span className="text-[10px] text-[#9CA3AF] bg-[#1F2A37] px-1.5 py-0.5 rounded">{token.chain}</span>
                  </div>
                  <span className={`text-xs font-medium tabular-nums ${token.change.startsWith('+') ? 'text-[#00FFA3]' : 'text-[#EF4444]'}`}>
                    {token.change}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#9CA3AF] tabular-nums">{token.price}</span>
                  <span className="text-xs text-[#9CA3AF]">Vol: {token.volume}</span>
                </div>
                <RiskBar score={token.risk} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Launch Token', href: '/launchpad/create', desc: 'Create & deploy your token', color: '#00FFA3' },
          { label: 'Analyze Wallet', href: '/intelligence', desc: 'Track smart money moves', color: '#3B82F6' },
          { label: 'Swap Tokens', href: '/dex', desc: 'Best-rate DEX aggregation', color: '#9CA3AF' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4 hover:border-[#2d3f52] transition-colors group"
          >
            <div className="text-sm font-semibold mb-1" style={{ color: action.color }}>{action.label}</div>
            <div className="text-xs text-[#9CA3AF]">{action.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
