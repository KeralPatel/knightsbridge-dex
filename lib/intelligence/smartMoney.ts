import { createAdminClient } from '@/lib/supabase/admin'

export interface SmartMoneyWallet {
  address: string
  label: string | null
  totalPnlUsd: number
  winRate: number
  txCount: number
  score: number
}

export interface SmartMoneyClassification {
  isSmartMoney: boolean
  score: number
  reasons: string[]
}

const SMART_MONEY_THRESHOLDS = {
  minWinRate: 0.65,          // 65% profitable trades
  minPnlUsd: 100_000,        // $100k realized PnL
  minTxCount: 50,            // at least 50 trades
  minVolume: 500_000,        // $500k lifetime volume
}

// Score 0–100 for how "smart" a wallet is
export function classifyWallet(wallet: {
  totalPnlUsd?: number | null
  winRate?: number | null
  txCount?: number
}): SmartMoneyClassification {
  const reasons: string[] = []
  let score = 0

  const pnl = wallet.totalPnlUsd ?? 0
  const winRate = wallet.winRate ?? 0
  const txCount = wallet.txCount ?? 0

  // Win rate component (0–40 pts)
  if (winRate >= 0.80) { score += 40; reasons.push('Win rate > 80%') }
  else if (winRate >= SMART_MONEY_THRESHOLDS.minWinRate) { score += 25; reasons.push('Win rate > 65%') }
  else if (winRate >= 0.5) { score += 10 }

  // PnL component (0–35 pts)
  if (pnl >= 1_000_000) { score += 35; reasons.push('PnL > $1M') }
  else if (pnl >= SMART_MONEY_THRESHOLDS.minPnlUsd) { score += 20; reasons.push('PnL > $100k') }
  else if (pnl >= 10_000) { score += 5 }

  // Activity component (0–25 pts)
  if (txCount >= 500) { score += 25; reasons.push('High activity trader') }
  else if (txCount >= SMART_MONEY_THRESHOLDS.minTxCount) { score += 15; reasons.push('Active trader') }
  else if (txCount >= 10) { score += 5 }

  const isSmartMoney = (
    winRate >= SMART_MONEY_THRESHOLDS.minWinRate &&
    pnl >= SMART_MONEY_THRESHOLDS.minPnlUsd &&
    txCount >= SMART_MONEY_THRESHOLDS.minTxCount
  )

  return { isSmartMoney, score: Math.min(100, score), reasons }
}

// Fetch top smart money wallets from DB
export async function getTopSmartMoneyWallets(
  chainId: number = 1,
  limit: number = 50
): Promise<SmartMoneyWallet[]> {
  const supabase = createAdminClient()
  const chain = chainId.toString() as '1' | '8453'

  const { data, error } = await supabase
    .from('wallets')
    .select('address, label, total_pnl_usd, win_rate, tx_count')
    .eq('chain', chain)
    .eq('is_smart_money', true)
    .order('total_pnl_usd', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((w) => ({
    address: w.address,
    label: w.label,
    totalPnlUsd: Number(w.total_pnl_usd ?? 0),
    winRate: Number(w.win_rate ?? 0),
    txCount: w.tx_count ?? 0,
    score: classifyWallet({
      totalPnlUsd: Number(w.total_pnl_usd),
      winRate: Number(w.win_rate),
      txCount: w.tx_count,
    }).score,
  }))
}

// Check if a specific address is in the smart money set
export async function isSmartMoneyWallet(address: string, chainId: number = 1): Promise<boolean> {
  const supabase = createAdminClient()
  const chain = chainId.toString() as '1' | '8453'

  const { data } = await supabase
    .from('wallets')
    .select('is_smart_money')
    .eq('address', address.toLowerCase())
    .eq('chain', chain)
    .single()

  return data?.is_smart_money === true
}

// Get count of smart money wallets in a token's holders
export async function countSmartMoneyHolders(
  holderAddresses: string[],
  chainId: number = 1
): Promise<number> {
  if (!holderAddresses.length) return 0
  const supabase = createAdminClient()
  const chain = chainId.toString() as '1' | '8453'

  const { count } = await supabase
    .from('wallets')
    .select('*', { count: 'exact', head: true })
    .eq('chain', chain)
    .eq('is_smart_money', true)
    .in('address', holderAddresses.map((a) => a.toLowerCase()))

  return count ?? 0
}
