import Link from 'next/link'
import { SmartMoneyTable } from '@/components/intelligence/SmartMoneyTable'
import { Badge } from '@/components/ui/Badge'

const MOCK_SMART_MONEY = [
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik.eth', totalPnlUsd: 4200000, winRate: 0.78, txCount: 892, score: 94 },
  { address: '0xAb5801a7D398351b8bE11C439e05C5b3259aec9b', label: null, totalPnlUsd: 1850000, winRate: 0.72, txCount: 1247, score: 88 },
  { address: '0x00000000219ab540356cBB839Cbe05303d7705Fa', label: 'Smart Wallet #3', totalPnlUsd: 920000, winRate: 0.68, txCount: 534, score: 81 },
  { address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', label: null, totalPnlUsd: 680000, winRate: 0.71, txCount: 312, score: 79 },
  { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', label: 'Alpha Trader', totalPnlUsd: 420000, winRate: 0.65, txCount: 198, score: 72 },
]

const RECENT_INTEL = [
  { type: 'entry', wallets: 5, token: 'TOKENX', action: 'accumulated', value: '$2.4M', time: '2m ago', severity: 'high' },
  { type: 'exit', wallets: 2, token: 'PEPE2', action: 'exited fully', value: '$890K', time: '12m ago', severity: 'critical' },
  { type: 'entry', wallets: 8, token: 'MOONCAT', action: 'began accumulating', value: '$4.1M', time: '28m ago', severity: 'medium' },
  { type: 'cluster', wallets: 12, token: 'SCAM99', action: 'coordinated buy detected', value: '$120K', time: '45m ago', severity: 'critical' },
]

export default function IntelligencePage() {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#E5E7EB]">Intelligence</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Smart money tracking and wallet clustering</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span className="live-dot w-1.5 h-1.5 bg-[#00FFA3] rounded-full" />
          Real-time
        </div>
      </div>

      {/* Wallet search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder="Search wallet address or ENS..."
            className="w-full bg-[#11161D] border border-[#1F2A37] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:border-[#00FFA3] focus:outline-none"
          />
        </div>
        <button className="bg-[#11161D] border border-[#1F2A37] rounded-lg px-4 py-2.5 text-sm text-[#9CA3AF] hover:border-[#2d3f52] transition-colors">
          Analyze
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Smart Money Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Intel */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#E5E7EB]">Smart Money Activity</span>
                <span className="live-dot w-1.5 h-1.5 bg-[#00FFA3] rounded-full" />
              </div>
              <Link href="/signals" className="text-xs text-[#9CA3AF] hover:text-[#00FFA3] transition-colors">
                All signals →
              </Link>
            </div>
            <div className="divide-y divide-[rgba(31,42,55,0.5)]">
              {RECENT_INTEL.map((intel, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    intel.severity === 'critical' ? 'bg-[#EF4444]' :
                    intel.severity === 'high' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E5E7EB]">
                      <span className="font-semibold text-[#00FFA3]">{intel.wallets} smart wallets</span>
                      {' '}{intel.action}{' '}
                      <span className="font-mono text-[#E5E7EB]">{intel.token}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold tabular-nums" style={{ color: intel.type === 'exit' ? '#EF4444' : '#00FFA3' }}>
                        {intel.value}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">{intel.time}</span>
                    </div>
                  </div>
                  <Badge
                    variant={intel.type === 'exit' || intel.severity === 'critical' ? 'red' : 'green'}
                    size="xs"
                  >
                    {intel.type === 'entry' ? 'BUY' : intel.type === 'exit' ? 'EXIT' : 'ALERT'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Top Smart Wallets Table */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
              <span className="text-sm font-semibold text-[#E5E7EB]">Top Smart Money Wallets</span>
              <Badge variant="blue" size="xs">Pro Feature</Badge>
            </div>
            <SmartMoneyTable wallets={MOCK_SMART_MONEY} chainId={1} />
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-3">
          {/* Stats */}
          {[
            { label: 'Smart Wallets Tracked', value: '1,247', change: '+34 today', color: '#00FFA3' },
            { label: 'Active Clusters', value: '89', change: '12 suspicious', color: '#F59E0B' },
            { label: 'Insider Detections', value: '23', change: 'last 24h', color: '#EF4444' },
            { label: 'Avg Smart Money Return', value: '+847%', change: 'last 30d', color: '#3B82F6' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
              <div className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">{stat.label}</div>
              <div className="text-xl font-semibold tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-[#9CA3AF] mt-0.5">{stat.change}</div>
            </div>
          ))}

          {/* Cluster map placeholder */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#E5E7EB]">Cluster Map</span>
              <Badge variant="blue" size="xs">Pro</Badge>
            </div>
            <div className="h-32 bg-[#0B0F14] rounded flex items-center justify-center text-xs text-[#9CA3AF] relative overflow-hidden">
              {/* Placeholder cluster visualization */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full opacity-60"
                  style={{
                    width: `${8 + (i % 3) * 6}px`,
                    height: `${8 + (i % 3) * 6}px`,
                    left: `${10 + (i % 5) * 18}%`,
                    top: `${15 + Math.floor(i / 5) * 30}%`,
                    backgroundColor: i % 4 === 0 ? '#EF4444' : i % 3 === 0 ? '#00FFA3' : '#3B82F6',
                  }}
                />
              ))}
              <span className="relative z-10 text-[#9CA3AF] text-xs">Upgrade to Pro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
