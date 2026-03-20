import { createClient } from '@supabase/supabase-js'
import { logger } from '../../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LARGE_TRANSFER_USD = 100_000 // $100K threshold

export interface DetectedSignal {
  type: string
  chain: string
  tokenAddress?: string
  walletAddress?: string
  title: string
  description: string
  strength: number
  tierRequired: 'free' | 'pro' | 'enterprise'
  txHash?: string
  blockNumber?: number
  metadata: Record<string, unknown>
}

export async function detectLargeTransfers(chain: string): Promise<DetectedSignal[]> {
  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString() // Last 2 minutes

  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('chain', chain)
    .gte('block_time', since)
    .gte('value_usd', LARGE_TRANSFER_USD)
    .order('value_usd', { ascending: false })
    .limit(20)

  if (!txs || txs.length === 0) return []

  return txs.map((tx) => {
    const valueStr = tx.value_usd >= 1_000_000
      ? `$${(tx.value_usd / 1_000_000).toFixed(2)}M`
      : `$${(tx.value_usd / 1_000).toFixed(0)}K`

    const strength = Math.min(
      100,
      Math.round(40 + Math.log10(tx.value_usd / LARGE_TRANSFER_USD) * 30)
    )

    return {
      type: 'large_transfer',
      chain,
      tokenAddress: tx.token_address,
      walletAddress: tx.from_address,
      title: `Large transfer detected: ${valueStr}`,
      description: `${valueStr} transferred from ${tx.from_address?.slice(0, 6)}...`,
      strength,
      tierRequired: 'free' as const,
      txHash: tx.hash,
      blockNumber: tx.block_number,
      metadata: { valueUsd: tx.value_usd },
    }
  })
}
