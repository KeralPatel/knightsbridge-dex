import { createClient } from '@supabase/supabase-js'
import { DetectedSignal } from './largeTransfer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIN_INSIDER_WALLETS = 3
const PRE_LAUNCH_WINDOW_HOURS = 24

const KNOWN_ROUTERS = new Set([
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Uniswap V2
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', // Uniswap V3
  '0x0000000000000000000000000000000000000000', // Zero address
])

export async function detectInsiderBuys(chain: string): Promise<DetectedSignal[]> {
  const now = new Date()

  // Find listings launching in the next 24h or that launched in last hour
  const windowStart = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + PRE_LAUNCH_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data: listings } = await supabase
    .from('launchpad_listings')
    .select('*')
    .gte('launch_at', windowStart)
    .lte('launch_at', windowEnd)
    .not('token_address', 'is', null)

  if (!listings || listings.length === 0) return []

  const signals: DetectedSignal[] = []

  for (const listing of listings) {
    if (!listing.token_address || !listing.launch_at) continue

    const preLaunchStart = new Date(
      new Date(listing.launch_at).getTime() - PRE_LAUNCH_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString()

    // Find wallets that bought the token before launch
    const { data: preLaunchTxs } = await supabase
      .from('transactions')
      .select('from_address')
      .eq('token_address', listing.token_address.toLowerCase())
      .eq('chain', chain)
      .gte('block_time', preLaunchStart)
      .lt('block_time', listing.launch_at)

    if (!preLaunchTxs || preLaunchTxs.length === 0) continue

    // Filter out known routers and deployer
    const uniqueBuyers = new Set(
      preLaunchTxs
        .map((t) => t.from_address as string)
        .filter((addr) => addr && !KNOWN_ROUTERS.has(addr.toLowerCase()))
        .filter((addr) => addr !== listing.creator_wallet?.toLowerCase())
    )

    if (uniqueBuyers.size < MIN_INSIDER_WALLETS) continue

    const confidence = uniqueBuyers.size >= 5 ? 'HIGH' : 'MEDIUM'

    signals.push({
      type: 'insider_buy',
      chain,
      tokenAddress: listing.token_address,
      title: `${uniqueBuyers.size} potential insiders before ${listing.symbol} launch`,
      description: `${uniqueBuyers.size} wallets bought ${listing.symbol} before the listed launch time — potential insider activity`,
      strength: uniqueBuyers.size >= 5 ? 88 : 70,
      tierRequired: 'pro',
      metadata: {
        insiderCount: uniqueBuyers.size,
        confidence,
        listingId: listing.id,
      },
    })
  }

  return signals
}
