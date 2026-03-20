import { AddressTag } from '@/components/common/AddressTag'
import { Badge } from '@/components/ui/Badge'

interface Holder {
  address: string
  amount: string
  percentage: number
  label: string | null
  isSmartMoney: boolean
  isDevWallet: boolean
}

interface TopHoldersTableProps {
  holders: Holder[]
  chainId?: number
}

export function TopHoldersTable({ holders, chainId = 1 }: TopHoldersTableProps) {
  if (holders.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-[#9CA3AF]">
        Holder data not available
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>#</th>
            <th>Address</th>
            <th>Amount</th>
            <th className="text-right">% Supply</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((holder, i) => (
            <tr key={holder.address}>
              <td className="text-[#9CA3AF] font-mono text-xs">{i + 1}</td>
              <td>
                <div className="flex items-center gap-2">
                  {holder.label && (
                    <span className="text-xs text-[#E5E7EB] font-medium">{holder.label}</span>
                  )}
                  <AddressTag address={holder.address} chainId={chainId} chars={4} />
                </div>
              </td>
              <td className="font-mono text-xs text-[#9CA3AF]">{holder.amount}</td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-1 bg-[#1F2A37] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3B82F6] rounded-full"
                      style={{ width: `${Math.min(100, holder.percentage)}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-[#E5E7EB] font-medium w-10 text-right">
                    {holder.percentage.toFixed(2)}%
                  </span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-1">
                  {holder.isSmartMoney && (
                    <Badge variant="green" size="xs">Smart</Badge>
                  )}
                  {holder.isDevWallet && (
                    <Badge variant="red" size="xs">Dev</Badge>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
