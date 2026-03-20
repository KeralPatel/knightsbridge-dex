import { AddressTag } from '@/components/common/AddressTag'
import { Badge } from '@/components/ui/Badge'

interface SmartMoneyWallet {
  address: string
  label: string | null
  totalPnlUsd: number
  winRate: number
  txCount: number
  score: number
}

interface SmartMoneyTableProps {
  wallets: SmartMoneyWallet[]
  chainId?: number
}

export function SmartMoneyTable({ wallets, chainId = 1 }: SmartMoneyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>#</th>
            <th>Wallet</th>
            <th>Score</th>
            <th className="text-right">Total PnL</th>
            <th className="text-right">Win Rate</th>
            <th className="text-right">Trades</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((wallet, i) => (
            <tr key={wallet.address}>
              <td className="text-[#9CA3AF] font-mono text-xs">{i + 1}</td>
              <td>
                <div className="flex items-center gap-2">
                  {wallet.label && (
                    <span className="text-xs text-[#E5E7EB] font-medium">{wallet.label}</span>
                  )}
                  <AddressTag address={wallet.address} chainId={chainId} chars={4} />
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#1F2A37] rounded-full max-w-16">
                    <div
                      className="h-full bg-[#00FFA3] rounded-full"
                      style={{ width: `${wallet.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#00FFA3] tabular-nums font-medium">{wallet.score}</span>
                </div>
              </td>
              <td className="text-right">
                <span className={`text-sm font-medium tabular-nums ${wallet.totalPnlUsd >= 0 ? 'text-[#00FFA3]' : 'text-[#EF4444]'}`}>
                  ${wallet.totalPnlUsd >= 0 ? '+' : ''}{wallet.totalPnlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </td>
              <td className="text-right">
                <span className="text-sm tabular-nums text-[#E5E7EB]">
                  {(wallet.winRate * 100).toFixed(1)}%
                </span>
              </td>
              <td className="text-right">
                <span className="text-sm tabular-nums text-[#9CA3AF]">
                  {wallet.txCount.toLocaleString()}
                </span>
              </td>
              <td>
                <Badge variant="green" size="xs" dot>Active</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
