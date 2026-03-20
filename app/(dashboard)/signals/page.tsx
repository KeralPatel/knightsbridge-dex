import { SignalsFeed } from '@/components/signals/SignalsFeed'
import { Badge } from '@/components/ui/Badge'

const SIGNAL_STATS = [
  { label: 'Total Today', value: '147', color: '#E5E7EB' },
  { label: 'Critical Alerts', value: '12', color: '#EF4444' },
  { label: 'Smart Money', value: '34', color: '#00FFA3' },
  { label: 'Avg Strength', value: '72', color: '#3B82F6' },
]

const RECENT_CRITICAL = [
  { type: 'rug_pattern', token: 'SCAM99', title: '12 smart wallets exited', strength: 94, time: '3m ago' },
  { type: 'insider_buy', token: 'MOONCAT', title: 'Pre-launch insiders detected', strength: 88, time: '18m ago' },
  { type: 'liquidity_removal', token: 'PEPE2', title: '$890K LP removed', strength: 97, time: '31m ago' },
]

export default function SignalsPage() {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#E5E7EB]">Signals</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Real-time on-chain intelligence alerts</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
          <span className="live-dot w-1.5 h-1.5 bg-[#00FFA3] rounded-full" />
          Live
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SIGNAL_STATS.map((stat) => (
          <div key={stat.label} className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-3">
            <div className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">{stat.label}</div>
            <div className="text-xl font-semibold tabular-nums" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main feed */}
        <div className="lg:col-span-2">
          <SignalsFeed />
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Critical alerts */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
              <span className="text-sm font-semibold text-[#E5E7EB]">Critical Alerts</span>
              <Badge variant="red" size="xs">LIVE</Badge>
            </div>
            <div className="divide-y divide-[rgba(31,42,55,0.5)]">
              {RECENT_CRITICAL.map((alert, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full shrink-0" />
                        <span className="text-xs font-mono text-[#E5E7EB] font-medium">{alert.token}</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">{alert.title}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#EF4444]">{alert.strength}</div>
                      <div className="text-[10px] text-[#9CA3AF]">{alert.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal type breakdown */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <div className="text-sm font-semibold text-[#E5E7EB] mb-3">Today by Type</div>
            <div className="space-y-2">
              {[
                { type: 'Smart Money Entry', count: 34, color: '#00FFA3' },
                { type: 'Large Transfer', count: 28, color: '#3B82F6' },
                { type: 'Whale Accumulation', count: 22, color: '#00FFA3' },
                { type: 'Rug Pattern', count: 18, color: '#EF4444' },
                { type: 'Liquidity Removal', count: 15, color: '#EF4444' },
                { type: 'Insider Buy', count: 12, color: '#F59E0B' },
                { type: 'Unusual Volume', count: 11, color: '#F59E0B' },
                { type: 'Honeypot', count: 7, color: '#EF4444' },
              ].map((item) => (
                <div key={item.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#9CA3AF]">{item.type}</span>
                  </div>
                  <span className="tabular-nums font-medium text-[#E5E7EB]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro upgrade banner */}
          <div className="bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.2)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-[#E5E7EB]">Get Pro Signals</span>
              <Badge variant="blue" size="xs">Pro</Badge>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-3">
              Unlock insider detection, DEV wallet moves, and high-strength alerts before they go public.
            </p>
            <a
              href="/settings"
              className="block text-center bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              Upgrade to Pro — $99/mo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
