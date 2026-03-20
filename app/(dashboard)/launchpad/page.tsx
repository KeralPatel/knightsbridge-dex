import Link from 'next/link'
import { LaunchpadCard, LaunchpadListing } from '@/components/launchpad/LaunchpadCard'
import { Button } from '@/components/ui/Button'

// Mock data — in production fetched from /api/launchpad
const MOCK_LISTINGS: LaunchpadListing[] = [
  {
    id: '1',
    name: 'MoonCat Token',
    symbol: 'MCAT',
    description: 'The first deflationary cat token with automatic liquidity generation and buy-back mechanism.',
    chainId: 1,
    status: 'live',
    riskScore: 32,
    smartMoneyCount: 7,
    liquidityEth: 5.2,
    lockDurationDays: 365,
    creatorWallet: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    raiseTarget: 10,
    raiseCurrent: 7.4,
  },
  {
    id: '2',
    name: 'DegenApe Finance',
    symbol: 'DAPEF',
    description: 'Yield-bearing meme token with NFT staking. Based on Base L2.',
    chainId: 8453,
    status: 'pending',
    launchAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    riskScore: 58,
    smartMoneyCount: 3,
    liquidityEth: 2.0,
    lockDurationDays: 180,
    creatorWallet: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
  },
  {
    id: '3',
    name: 'SafeRocket',
    symbol: 'SRKT',
    description: 'Community-driven token with multi-sig treasury and DAO governance.',
    chainId: 1,
    status: 'pending',
    launchAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    riskScore: 21,
    smartMoneyCount: 12,
    liquidityEth: 8.5,
    lockDurationDays: 730,
    creatorWallet: '0x1234567890AbCdEf1234567890AbCdEf12345678',
    raiseTarget: 20,
    raiseCurrent: 0,
  },
  {
    id: '4',
    name: 'PEPE2000',
    symbol: 'PP2K',
    description: 'The definitive Pepe successor.',
    chainId: 8453,
    status: 'live',
    riskScore: 87,
    smartMoneyCount: 0,
    liquidityEth: 0.5,
    lockDurationDays: 30,
    creatorWallet: '0xDeAdBeEf1234567890AbCdEf1234567890DEAD00',
    raiseTarget: 5,
    raiseCurrent: 1.2,
  },
  {
    id: '5',
    name: 'AstroDAO',
    symbol: 'ASTRO',
    description: 'Decentralized space exploration funding platform.',
    chainId: 1,
    status: 'live',
    riskScore: 15,
    smartMoneyCount: 19,
    liquidityEth: 15.0,
    lockDurationDays: 1095,
    creatorWallet: '0x9876543210FeDcBa9876543210FeDcBa98765432',
  },
  {
    id: '6',
    name: 'HoneyTrap Finance',
    symbol: 'HTF',
    description: 'Suspicious token with no verified contract.',
    chainId: 1,
    status: 'pending',
    launchAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    riskScore: 94,
    smartMoneyCount: 0,
    liquidityEth: 0.1,
    lockDurationDays: 0,
    creatorWallet: '0xBaDaCe001234567890AbCdEf1234567890BaDaCe',
  },
]

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Highest Risk', value: 'risk_high' },
  { label: 'Lowest Risk', value: 'risk_low' },
  { label: 'Smart Money', value: 'smart_money' },
  { label: 'Launch Time', value: 'launch_at' },
]

export default function LaunchpadPage() {
  const live = MOCK_LISTINGS.filter((l) => l.status === 'live')
  const pending = MOCK_LISTINGS.filter((l) => l.status === 'pending')

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#E5E7EB]">Launchpad</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            {live.length} live · {pending.length} upcoming
          </p>
        </div>
        <Link href="/launchpad/create">
          <Button size="sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Launch Token
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 bg-[#11161D] border border-[#1F2A37] rounded-lg px-4 py-3">
        {[
          { label: 'Total Launches', value: MOCK_LISTINGS.length.toString() },
          { label: 'Live Now', value: live.length.toString(), color: '#00FFA3' },
          { label: 'Avg Risk Score', value: Math.round(MOCK_LISTINGS.reduce((a, l) => a + l.riskScore, 0) / MOCK_LISTINGS.length).toString() },
          { label: 'Smart Money Active', value: MOCK_LISTINGS.reduce((a, l) => a + l.smartMoneyCount, 0).toString(), color: '#3B82F6' },
        ].map((stat, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="text-lg font-semibold tabular-nums" style={{ color: stat.color || '#E5E7EB' }}>
              {stat.value}
            </div>
            <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Live tokens */}
      {live.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-[#E5E7EB]">Live Now</span>
            <span className="live-dot w-1.5 h-1.5 bg-[#00FFA3] rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {live.map((listing) => (
              <LaunchpadCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#E5E7EB] mb-3">Upcoming Launches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pending.map((listing) => (
              <LaunchpadCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Risk warning */}
      <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-xs text-[#EF4444] font-semibold">DYOR — Do Your Own Research</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Risk scores are algorithmic estimates. Tokens with scores above 50 carry significant risk of loss.
            Never invest more than you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  )
}
