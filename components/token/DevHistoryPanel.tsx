import { AddressTag } from '@/components/common/AddressTag'
import { Badge } from '@/components/ui/Badge'

interface PreviousToken {
  address: string
  name: string
  symbol: string
  deployedAt: string
  outcome: 'rug' | 'abandoned' | 'active' | 'graduated'
  peakMcap: number | null
  riskScore: number | null
}

interface DevHistoryPanelProps {
  deployer: string | null
  chainId?: number
  previousTokens?: PreviousToken[]
}

const OUTCOME_CONFIG = {
  rug: { label: 'Rugged', variant: 'red' as const },
  abandoned: { label: 'Abandoned', variant: 'red' as const },
  active: { label: 'Active', variant: 'green' as const },
  graduated: { label: 'Graduated', variant: 'blue' as const },
}

export function DevHistoryPanel({ deployer, chainId = 1, previousTokens = [] }: DevHistoryPanelProps) {
  const rugCount = previousTokens.filter((t) => t.outcome === 'rug' || t.outcome === 'abandoned').length
  const hasRedFlags = rugCount > 0

  return (
    <div className="space-y-3">
      {/* Deployer address */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#9CA3AF]">Deployer</span>
        {deployer ? (
          <AddressTag address={deployer} chainId={chainId} chars={6} />
        ) : (
          <span className="text-xs text-[#9CA3AF]">Unknown</span>
        )}
      </div>

      {/* Risk summary */}
      {previousTokens.length > 0 && (
        <div className={`rounded p-2.5 text-xs ${
          hasRedFlags
            ? 'bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)]'
            : 'bg-[rgba(0,255,163,0.05)] border border-[rgba(0,255,163,0.2)]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={hasRedFlags ? 'text-[#EF4444] font-semibold' : 'text-[#00FFA3] font-semibold'}>
              {previousTokens.length} previous token{previousTokens.length !== 1 ? 's' : ''}
            </span>
            {hasRedFlags && (
              <span className="text-[#EF4444]">{rugCount} rug/abandoned</span>
            )}
          </div>
          {!hasRedFlags && (
            <span className="text-[#00FFA3]">No prior rug history</span>
          )}
        </div>
      )}

      {previousTokens.length === 0 && (
        <div className="text-center py-4 text-xs text-[#9CA3AF]">
          No previous token deployments found
        </div>
      )}

      {/* Token history list */}
      {previousTokens.length > 0 && (
        <div className="space-y-2">
          {previousTokens.map((token) => {
            const config = OUTCOME_CONFIG[token.outcome]
            return (
              <a
                key={token.address}
                href={`/token/${token.address}`}
                className="flex items-center justify-between p-2.5 bg-[#0B0F14] border border-[#1F2A37] rounded hover:border-[#2d3f52] transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-[#E5E7EB] font-medium">{token.symbol}</span>
                    <span className="text-[10px] text-[#9CA3AF] truncate">{token.name}</span>
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                    {new Date(token.deployedAt).toLocaleDateString()}
                    {token.peakMcap && (
                      <> · Peak ${(token.peakMcap / 1000).toFixed(0)}K</>
                    )}
                  </div>
                </div>
                <Badge variant={config.variant} size="xs">{config.label}</Badge>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
