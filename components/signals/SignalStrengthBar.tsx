interface SignalStrengthBarProps {
  strength: number // 1–100
  size?: 'sm' | 'md'
}

export function SignalStrengthBar({ strength, size = 'sm' }: SignalStrengthBarProps) {
  const color =
    strength >= 80 ? '#EF4444' :
    strength >= 60 ? '#F59E0B' :
    strength >= 40 ? '#3B82F6' : '#9CA3AF'

  const bars = 5
  const filled = Math.ceil((strength / 100) * bars)
  const h = size === 'sm' ? 8 : 12
  const w = size === 'sm' ? 4 : 6

  return (
    <div className="flex items-end gap-0.5" title={`Signal strength: ${strength}/100`}>
      {Array.from({ length: bars }, (_, i) => {
        const barH = h * (0.4 + (i / bars) * 0.6)
        return (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: w,
              height: barH,
              backgroundColor: i < filled ? color : '#1F2A37',
            }}
          />
        )
      })}
    </div>
  )
}
