'use client'

interface DistributionData {
  top10Pct: number
  top20Pct: number
  top50Pct: number
}

interface HolderDistributionProps {
  distribution: DistributionData | null
  holderCount: number | null
}

export function HolderDistribution({ distribution, holderCount }: HolderDistributionProps) {
  if (!distribution) {
    return (
      <div className="text-center py-8 text-sm text-[#9CA3AF]">
        Distribution data not available
      </div>
    )
  }

  const rest = 100 - distribution.top50Pct
  const segments = [
    { label: 'Top 10', pct: distribution.top10Pct, color: '#EF4444' },
    { label: 'Top 11–20', pct: distribution.top20Pct - distribution.top10Pct, color: '#F59E0B' },
    { label: 'Top 21–50', pct: distribution.top50Pct - distribution.top20Pct, color: '#3B82F6' },
    { label: 'Rest', pct: rest, color: '#00FFA3' },
  ]

  // SVG donut chart
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 44
  const strokeWidth = 20
  const circumference = 2 * Math.PI * r

  let offset = 0
  const arcs = segments.map((seg) => {
    const dash = (seg.pct / 100) * circumference
    const arc = { ...seg, dash, offset }
    offset += dash
    return arc
  })

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width={size} height={size}>
            {/* Background */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="#1F2A37"
              strokeWidth={strokeWidth}
            />
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.dash} ${circumference}`}
                strokeDashoffset={-arc.offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            ))}
            {/* Center text */}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#E5E7EB" fontSize="14" fontWeight="700" fontFamily="Inter">
              {holderCount?.toLocaleString() ?? '—'}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#9CA3AF" fontSize="9" fontFamily="Inter" letterSpacing="0.05em">
              HOLDERS
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs flex-1">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[#9CA3AF]">{seg.label}</span>
              </div>
              <span className="tabular-nums font-medium text-[#E5E7EB]">{seg.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Concentration risk */}
      <div className={`rounded p-2.5 text-xs ${
        distribution.top10Pct > 80
          ? 'bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] text-[#EF4444]'
          : distribution.top10Pct > 60
          ? 'bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] text-[#F59E0B]'
          : 'bg-[rgba(0,255,163,0.05)] border border-[rgba(0,255,163,0.2)] text-[#00FFA3]'
      }`}>
        {distribution.top10Pct > 80
          ? `⚠ High concentration — top 10 hold ${distribution.top10Pct.toFixed(1)}%`
          : distribution.top10Pct > 60
          ? `Moderate concentration — top 10 hold ${distribution.top10Pct.toFixed(1)}%`
          : `Healthy distribution — top 10 hold ${distribution.top10Pct.toFixed(1)}%`}
      </div>
    </div>
  )
}
