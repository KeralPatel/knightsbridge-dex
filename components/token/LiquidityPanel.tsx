import { Badge } from '@/components/ui/Badge'

interface LiquidityPanelProps {
  liquidityUsd: number | null
  marketCapUsd: number | null
  lpLockedPct: number | null
  lockExpiresAt: string | null
  hasFakeLp: boolean | null
}

export function LiquidityPanel({
  liquidityUsd,
  marketCapUsd,
  lpLockedPct,
  lockExpiresAt,
  hasFakeLp,
}: LiquidityPanelProps) {
  const lpMcapRatio =
    liquidityUsd !== null && marketCapUsd !== null && marketCapUsd > 0
      ? (liquidityUsd / marketCapUsd) * 100
      : null

  const lockStatus =
    lpLockedPct === null
      ? 'unknown'
      : lpLockedPct >= 95
      ? 'locked'
      : lpLockedPct >= 50
      ? 'partial'
      : 'unlocked'

  const lockConfig = {
    locked: { label: 'Locked', variant: 'green' as const },
    partial: { label: 'Partial', variant: 'blue' as const },
    unlocked: { label: 'Unlocked', variant: 'red' as const },
    unknown: { label: 'Unknown', variant: 'red' as const },
  }

  return (
    <div className="space-y-3 text-xs">
      {hasFakeLp && (
        <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded p-2.5 text-[#EF4444]">
          ⚠ Fake liquidity detected — LP tokens held by deployer
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-[#9CA3AF]">Total Liquidity</span>
          <span className="font-medium tabular-nums text-[#E5E7EB]">
            {liquidityUsd !== null
              ? `$${liquidityUsd >= 1_000_000
                  ? (liquidityUsd / 1_000_000).toFixed(2) + 'M'
                  : (liquidityUsd / 1_000).toFixed(1) + 'K'}`
              : '—'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#9CA3AF]">LP / Market Cap</span>
          <span className={`font-medium tabular-nums ${
            lpMcapRatio === null ? 'text-[#9CA3AF]' :
            lpMcapRatio < 1 ? 'text-[#EF4444]' :
            lpMcapRatio < 5 ? 'text-[#F59E0B]' : 'text-[#00FFA3]'
          }`}>
            {lpMcapRatio !== null ? `${lpMcapRatio.toFixed(1)}%` : '—'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[#9CA3AF]">LP Lock Status</span>
          <Badge variant={lockConfig[lockStatus].variant} size="xs">
            {lockConfig[lockStatus].label}
          </Badge>
        </div>

        {lpLockedPct !== null && (
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Locked %</span>
            <span className="font-medium tabular-nums text-[#E5E7EB]">{lpLockedPct.toFixed(1)}%</span>
          </div>
        )}

        {lockExpiresAt && (
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Lock Expires</span>
            <span className="font-medium text-[#E5E7EB]">
              {new Date(lockExpiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* LP ratio bar */}
      {lpMcapRatio !== null && (
        <div>
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>0%</span>
            <span>LP Health</span>
            <span>20%+</span>
          </div>
          <div className="h-1.5 bg-[#1F2A37] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, lpMcapRatio * 5)}%`,
                backgroundColor: lpMcapRatio < 1 ? '#EF4444' : lpMcapRatio < 5 ? '#F59E0B' : '#00FFA3',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
