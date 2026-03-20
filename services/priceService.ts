import { createServerSupabaseClient } from '@/lib/supabase/admin'

export interface PricePoint {
  time: number // unix timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Fetches OHLCV price data for a token.
 * In production this would aggregate from indexed swap events.
 * For now queries stored transactions and synthesizes candles.
 */
export async function getTokenPriceHistory(
  tokenAddress: string,
  chain: string,
  resolution: '1h' | '4h' | '1d' = '1h',
  limit = 168
): Promise<PricePoint[]> {
  const supabase = createServerSupabaseClient()

  // Fetch recent swap transactions for this token
  const { data: txs } = await supabase
    .from('transactions')
    .select('block_time, value_usd, tx_type')
    .eq('token_address', tokenAddress.toLowerCase())
    .eq('token_chain', chain)
    .order('block_time', { ascending: false })
    .limit(500)

  if (!txs || txs.length === 0) return []

  // Group into candles by resolution
  const intervalMs =
    resolution === '1h' ? 3_600_000 :
    resolution === '4h' ? 14_400_000 : 86_400_000

  const buckets = new Map<number, { values: number[]; volume: number }>()

  for (const tx of txs) {
    if (!tx.value_usd) continue
    const time = Math.floor(new Date(tx.block_time).getTime() / intervalMs) * intervalMs
    const bucket = buckets.get(time) ?? { values: [], volume: 0 }
    bucket.values.push(tx.value_usd)
    bucket.volume += tx.value_usd
    buckets.set(time, bucket)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .slice(-limit)
    .map(([time, { values, volume }]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return {
        time: Math.floor(time / 1000),
        open: values[0],
        high: sorted[sorted.length - 1],
        low: sorted[0],
        close: values[values.length - 1],
        volume,
      }
    })
}
