import { PriceChart } from '@/components/token/PriceChart'
import { TokenHeaderBar } from '@/components/token/TokenHeaderBar'
import { TopHoldersTable } from '@/components/token/TopHoldersTable'
import { HolderDistribution } from '@/components/token/HolderDistribution'
import { DevHistoryPanel } from '@/components/token/DevHistoryPanel'
import { LiquidityPanel } from '@/components/token/LiquidityPanel'
import { WalletInflowOutflow } from '@/components/token/WalletInflowOutflow'
import { PaywallOverlay } from '@/components/common/PaywallOverlay'
import { RugScoreGauge } from '@/components/intelligence/RugScoreGauge'
import { Badge } from '@/components/ui/Badge'

// Mock token data — in production fetched from /api/tokens/[address]
const getMockToken = (address: string) => ({
  address,
  chain: '1',
  chainId: 1,
  name: 'TokenX',
  symbol: 'TOKENX',
  decimals: 18,
  deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  priceUsd: 0.00001247,
  marketCapUsd: 124700,
  volume24hUsd: 89400,
  liquidityUsd: 45200,
  holderCount: 1247,
  priceChange1h: 2.4,
  priceChange24h: 18.7,
  isVerified: false,
  isHoneypot: false,
  hasFakeLp: false,
  riskScore: 34,
  riskLevel: 'medium',
})

const MOCK_HOLDERS = [
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', amount: '420B', percentage: 12.4, label: 'Vitalik.eth', isSmartMoney: true, isDevWallet: false },
  { address: '0xAb5801a7D398351b8bE11C439e05C5b3259aec9b', amount: '380B', percentage: 11.2, label: null, isSmartMoney: true, isDevWallet: false },
  { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', amount: '310B', percentage: 9.1, label: 'Deployer', isSmartMoney: false, isDevWallet: true },
  { address: '0x00000000219ab540356cBB839Cbe05303d7705Fa', amount: '250B', percentage: 7.3, label: null, isSmartMoney: false, isDevWallet: false },
  { address: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', amount: '180B', percentage: 5.3, label: null, isSmartMoney: false, isDevWallet: false },
]

const MOCK_DISTRIBUTION = { top10Pct: 62.4, top20Pct: 74.1, top50Pct: 86.3 }

export default async function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>
}) {
  const { address } = await params
  const token = getMockToken(address)

  return (
    <div className="p-5 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
        <a href="/" className="hover:text-[#E5E7EB]">Dashboard</a>
        <span>/</span>
        <span className="text-[#E5E7EB] font-mono">{address.slice(0, 10)}...</span>
      </div>

      {/* Token header bar */}
      <TokenHeaderBar
        name={token.name}
        symbol={token.symbol}
        address={token.address}
        chainId={token.chainId}
        priceUsd={token.priceUsd}
        priceChange24h={token.priceChange24h}
        volume24hUsd={token.volume24hUsd}
        marketCapUsd={token.marketCapUsd}
        liquidityUsd={token.liquidityUsd}
        isVerified={token.isVerified}
        isHoneypot={token.isHoneypot}
        riskScore={token.riskScore}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Main content — chart + holders */}
        <div className="xl:col-span-3 space-y-4">
          {/* Price chart */}
          <PriceChart tokenAddress={token.address} chainId={token.chainId} />

          {/* Holders + distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top holders table */}
            <PaywallOverlay requiredTier="pro" feature="Top Holders">
              <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
                  <span className="text-sm font-semibold text-[#E5E7EB]">Top Holders</span>
                  <Badge variant="blue" size="xs">Pro</Badge>
                </div>
                <div className="p-1">
                  <TopHoldersTable holders={MOCK_HOLDERS} chainId={token.chainId} />
                </div>
              </div>
            </PaywallOverlay>

            {/* Holder distribution + net flow */}
            <div className="space-y-4">
              <PaywallOverlay requiredTier="pro" feature="Holder Distribution">
                <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[#E5E7EB]">Distribution</span>
                    <Badge variant="blue" size="xs">Pro</Badge>
                  </div>
                  <HolderDistribution
                    distribution={MOCK_DISTRIBUTION}
                    holderCount={token.holderCount}
                  />
                </div>
              </PaywallOverlay>

              <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
                <div className="mb-3">
                  <span className="text-sm font-semibold text-[#E5E7EB]">Wallet Flow (7d)</span>
                </div>
                <WalletInflowOutflow />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Risk score */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <div className="text-sm font-semibold text-[#E5E7EB] mb-3">Risk Score</div>
            <div className="flex justify-center mb-3">
              <RugScoreGauge score={token.riskScore ?? 0} size={100} />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Honeypot</span>
                <Badge variant={token.isHoneypot ? 'red' : 'green'} size="xs">
                  {token.isHoneypot ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Contract Verified</span>
                <Badge variant={token.isVerified ? 'green' : 'red'} size="xs">
                  {token.isVerified ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Fake LP</span>
                <Badge variant={token.hasFakeLp ? 'red' : 'green'} size="xs">
                  {token.hasFakeLp ? 'Detected' : 'None'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Liquidity */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <div className="text-sm font-semibold text-[#E5E7EB] mb-3">Liquidity</div>
            <LiquidityPanel
              liquidityUsd={token.liquidityUsd}
              marketCapUsd={token.marketCapUsd}
              lpLockedPct={78}
              lockExpiresAt="2025-12-31T00:00:00Z"
              hasFakeLp={token.hasFakeLp}
            />
          </div>

          {/* Dev history */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <div className="text-sm font-semibold text-[#E5E7EB] mb-3">Dev History</div>
            <DevHistoryPanel
              deployer={token.deployer}
              chainId={token.chainId}
              previousTokens={[]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
