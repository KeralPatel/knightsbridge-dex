import { createClient } from '@supabase/supabase-js'
import { DetectedSignal } from './largeTransfer'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Rug pattern: combined LP removal + dev wallet sells in same window
export async function detectRugPattern(chain: string): Promise<DetectedSignal[]> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes

  // Get tokens with recent LP removal signals
  const { data: lpSignals } = await supabase
    .from('signals')
    .select('token_address, metadata')
    .eq('type', 'liquidity_removal')
    .eq('chain', chain)
    .gte('created_at', since)

  if (!lpSignals || lpSignals.length === 0) return []

  const signals: DetectedSignal[] = []

  for (const lpSignal of lpSignals) {
    if (!lpSignal.token_address) continue

    // Check if deployer wallet has recent transfers out
    const { data: token } = await supabase
      .from('tokens')
      .select('deployer')
      .eq('address', lpSignal.token_address)
      .eq('chain', chain)
      .single()

    if (!token?.deployer) continue

    const { data: devTxs } = await supabase
      .from('transactions')
      .select('*')
      .eq('from_address', token.deployer)
      .eq('token_address', lpSignal.token_address)
      .eq('chain', chain)
      .gte('block_time', since)

    if (devTxs && devTxs.length > 0) {
      // Both LP removal AND dev wallet sell — high confidence rug
      signals.push({
        type: 'rug_pattern',
        chain,
        tokenAddress: lpSignal.token_address,
        walletAddress: token.deployer,
        title: `Rug pattern detected — LP removal + dev sell`,
        description: `Deployer ${token.deployer.slice(0, 6)}... is selling while LP is being removed`,
        strength: 95,
        tierRequired: 'free',
        metadata: {
          devAddress: token.deployer,
          devTxCount: devTxs.length,
        },
      })
    }
  }

  return signals
}
