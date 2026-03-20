import { createClient } from '@supabase/supabase-js'
import { DetectedSignal } from './largeTransfer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIN_SMART_WALLETS = 2
const WINDOW_MINUTES = 30

export async function detectSmartMoneyEntry(chain: string): Promise<DetectedSignal[]> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  // Get recent transactions by smart money wallets
  const { data: smartWallets } = await supabase
    .from('wallets')
    .select('address')
    .eq('is_smart_money', true)
    .eq('chain', chain)

  if (!smartWallets || smartWallets.length === 0) return []

  const smartAddresses = smartWallets.map((w) => w.address)

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('chain', chain)
    .in('from_address', smartAddresses)
    .gte('block_time', since)
    .not('token_address', 'is', null)

  if (!txs || txs.length === 0) return []

  // Group by token
  const byToken = new Map<string, typeof txs>()
  for (const tx of txs) {
    if (!tx.token_address) continue
    const group = byToken.get(tx.token_address) ?? []
    group.push(tx)
    byToken.set(tx.token_address, group)
  }

  const signals: DetectedSignal[] = []

  for (const [tokenAddress, tokenTxs] of byToken) {
    // Unique smart wallets for this token
    const uniqueWallets = new Set(tokenTxs.map((t) => t.from_address)).size
    if (uniqueWallets < MIN_SMART_WALLETS) continue

    const totalValue = tokenTxs.reduce((s, t) => s + (t.value_usd ?? 0), 0)
    const valueStr = totalValue >= 1_000_000
      ? `$${(totalValue / 1_000_000).toFixed(2)}M`
      : `$${(totalValue / 1_000).toFixed(0)}K`

    const strength = Math.min(100, 50 + uniqueWallets * 8 + Math.log10(Math.max(1, totalValue / 10_000)) * 5)

    signals.push({
      type: 'smart_money_entry',
      chain,
      tokenAddress,
      title: `${uniqueWallets} smart wallets accumulated ${tokenAddress.slice(0, 6)}...`,
      description: `${uniqueWallets} tracked smart money wallets bought ${valueStr} in the last ${WINDOW_MINUTES}m`,
      strength: Math.round(strength),
      tierRequired: 'free',
      metadata: { walletCount: uniqueWallets, totalValueUsd: totalValue },
    })
  }

  return signals
}
