'use client'

interface RugScoreGaugeProps {
  score: number
  size?: number
}

export function RugScoreGauge({ score, size = 120 }: RugScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const cx = size / 2
  const cy = size / 2
  const r = (size * 0.38)
  const strokeWidth = size * 0.1

  // Arc: 270° span (-135° to +135°)
  const startAngle = -225
  const totalAngle = 270
  const angle = startAngle + (clampedScore / 100) * totalAngle

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const circumference = 2 * Math.PI * r
  const dashArray = (totalAngle / 360) * circumference
  const filledDash = (clampedScore / 100) * dashArray

  // Color based on score
  const color =
    clampedScore >= 76 ? '#EF4444' :
    clampedScore >= 51 ? '#F59E0B' :
    clampedScore >= 26 ? '#3B82F6' :
    '#00FFA3'

  const level =
    clampedScore >= 76 ? 'CRITICAL' :
    clampedScore >= 51 ? 'HIGH' :
    clampedScore >= 26 ? 'MEDIUM' : 'LOW'

  // SVG arc path for background track
  const startX = cx + r * Math.cos(toRad(-225))
  const startY = cy + r * Math.sin(toRad(-225))
  const endX = cx + r * Math.cos(toRad(45))
  const endY = cy + r * Math.sin(toRad(45))

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#1F2A37"
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={circumference * 0.125}
          strokeLinecap="round"
          transform={`rotate(-225 ${cx} ${cy})`}
        />
        {/* Filled arc */}
        {clampedScore > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledDash} ${circumference}`}
            strokeDashoffset={circumference * 0.125}
            strokeLinecap="round"
            transform={`rotate(-225 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
          />
        )}
        {/* Score text */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.25}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          className="tabular-nums"
        >
          {clampedScore}
        </text>
        <text
          x={cx} y={cy + size * 0.14}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize={size * 0.1}
          fontFamily="Inter, sans-serif"
          letterSpacing="0.05em"
        >
          {level}
        </text>
      </svg>
    </div>
  )
}
