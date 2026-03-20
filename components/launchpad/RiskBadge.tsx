import { Tooltip } from '@/components/ui/Tooltip'

interface RiskBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

function getRiskConfig(score: number) {
  if (score >= 76) return { label: 'CRITICAL', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
  if (score >= 51) return { label: 'HIGH', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
  if (score >= 26) return { label: 'MEDIUM', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' }
  return { label: 'LOW', color: '#00FFA3', bg: 'rgba(0,255,163,0.1)', border: 'rgba(0,255,163,0.3)' }
}

export function RiskBadge({ score, showLabel = true, size = 'sm' }: RiskBadgeProps) {
  const { label, color, bg, border } = getRiskConfig(score)
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'

  return (
    <Tooltip content={`Risk score: ${score}/100 — ${label} risk`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded font-semibold tabular-nums cursor-default ${sizeClass}`}
        style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
      >
        <span>{score}</span>
        {showLabel && <span className="opacity-75">{label}</span>}
      </span>
    </Tooltip>
  )
}

export function RiskScoreBar({ score }: { score: number }) {
  const { color } = getRiskConfig(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#1F2A37] rounded-full">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums font-medium shrink-0" style={{ color }}>
        {score}
      </span>
    </div>
  )
}
