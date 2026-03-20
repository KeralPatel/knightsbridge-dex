'use client'

interface FlowBar {
  label: string
  inflow: number
  outflow: number
}

interface WalletInflowOutflowProps {
  data?: FlowBar[]
}

// Mock 7-day flow data
const MOCK_FLOW: FlowBar[] = [
  { label: 'Mon', inflow: 124000, outflow: 45000 },
  { label: 'Tue', inflow: 89000, outflow: 120000 },
  { label: 'Wed', inflow: 210000, outflow: 67000 },
  { label: 'Thu', inflow: 55000, outflow: 89000 },
  { label: 'Fri', inflow: 340000, outflow: 180000 },
  { label: 'Sat', inflow: 67000, outflow: 45000 },
  { label: 'Sun', inflow: 180000, outflow: 220000 },
]

export function WalletInflowOutflow({ data = MOCK_FLOW }: WalletInflowOutflowProps) {
  const maxVal = Math.max(...data.flatMap((d) => [d.inflow, d.outflow]))

  const totalInflow = data.reduce((s, d) => s + d.inflow, 0)
  const totalOutflow = data.reduce((s, d) => s + d.outflow, 0)
  const netFlow = totalInflow - totalOutflow

  return (
    <div className="space-y-3">
      {/* Net flow summary */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-[#9CA3AF]">Net 7d </span>
          <span className={`tabular-nums font-semibold ${netFlow >= 0 ? 'text-[#00FFA3]' : 'text-[#EF4444]'}`}>
            {netFlow >= 0 ? '+' : ''}${Math.abs(netFlow).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#00FFA3]" />
          <span className="text-[#9CA3AF]">Inflow</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#EF4444]" />
          <span className="text-[#9CA3AF]">Outflow</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-20">
        {data.map((bar) => {
          const inflowH = maxVal > 0 ? (bar.inflow / maxVal) * 80 : 0
          const outflowH = maxVal > 0 ? (bar.outflow / maxVal) * 80 : 0
          return (
            <div key={bar.label} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end gap-0.5" style={{ height: 72 }}>
                <div
                  className="flex-1 bg-[#00FFA3] opacity-70 rounded-t-sm min-h-[2px] transition-all"
                  style={{ height: `${inflowH}px` }}
                  title={`Inflow: $${bar.inflow.toLocaleString()}`}
                />
                <div
                  className="flex-1 bg-[#EF4444] opacity-70 rounded-t-sm min-h-[2px] transition-all"
                  style={{ height: `${outflowH}px` }}
                  title={`Outflow: $${bar.outflow.toLocaleString()}`}
                />
              </div>
              <span className="text-[9px] text-[#9CA3AF]">{bar.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
