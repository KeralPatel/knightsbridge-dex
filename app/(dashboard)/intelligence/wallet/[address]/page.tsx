import { WalletProfile } from '@/components/intelligence/WalletProfile'
import { SkeletonCard } from '@/components/common/LoadingSkeleton'
import { PaywallOverlay } from '@/components/common/PaywallOverlay'
import { AddressTag } from '@/components/common/AddressTag'
import { Badge } from '@/components/ui/Badge'

// Mock wallet data — in production fetched from /api/intelligence/wallet/[address]
const getMockWallet = (address: string) => ({
  address,
  chainId: 1,
  label: 'Smart Whale #1',
  isSmartMoney: true,
  isDevWallet: false,
  totalPnlUsd: 1_240_000,
  winRate: 0.74,
  txCount: 892,
  riskScore: 18,
  firstSeenAt: '2021-03-15T00:00:00Z',
  lastActiveAt: new Date().toISOString(),
  cluster: { id: 7, label: 'Alpha Traders', behaviorTags: ['coordinated', 'synchronized'] },
  tags: ['smart_money', 'early_buyer', 'whale'],
})

const MOCK_TXS = [
  { hash: '0xabc...123', type: 'buy', token: 'TOKENX', amount: '2.4M', value: '$24,000', time: '2h ago', pnl: '+$8,200' },
  { hash: '0xdef...456', type: 'sell', token: 'PEPE2', amount: '12B', value: '$180,000', time: '1d ago', pnl: '+$42,000' },
  { hash: '0xghi...789', type: 'buy', token: 'MOONCAT', amount: '500K', value: '$12,000', time: '3d ago', pnl: '-$2,100' },
  { hash: '0xjkl...012', type: 'sell', token: 'DOGE3', amount: '8M', value: '$89,000', time: '5d ago', pnl: '+$31,000' },
  { hash: '0xmno...345', type: 'buy', token: 'WOJAK', amount: '4M', value: '$6,000', time: '7d ago', pnl: '+$18,000' },
]

export default async function WalletPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const wallet = getMockWallet(address)

  return (
    <div className="p-5 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
        <a href="/intelligence" className="hover:text-[#E5E7EB]">Intelligence</a>
        <span>/</span>
        <span className="text-[#E5E7EB] font-mono">{address.slice(0, 10)}...</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div>
          <WalletProfile wallet={wallet} />
        </div>

        {/* Transaction history */}
        <div className="lg:col-span-2">
          <PaywallOverlay requiredTier="pro" feature="Wallet Transaction History">
            <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
                <span className="text-sm font-semibold text-[#E5E7EB]">Transaction History</span>
                <Badge variant="blue" size="xs">Pro</Badge>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Token</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">PnL</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TXS.map((tx) => (
                    <tr key={tx.hash}>
                      <td>
                        <Badge
                          variant={tx.type === 'buy' ? 'green' : 'red'}
                          size="xs"
                        >
                          {tx.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs text-[#E5E7EB]">{tx.token}</td>
                      <td className="text-right tabular-nums text-xs text-[#9CA3AF]">{tx.amount}</td>
                      <td className="text-right tabular-nums text-sm text-[#E5E7EB] font-medium">{tx.value}</td>
                      <td className="text-right tabular-nums text-sm font-medium">
                        <span className={tx.pnl.startsWith('+') ? 'text-[#00FFA3]' : 'text-[#EF4444]'}>
                          {tx.pnl}
                        </span>
                      </td>
                      <td className="text-xs text-[#9CA3AF]">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PaywallOverlay>
        </div>
      </div>
    </div>
  )
}
