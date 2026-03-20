import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/admin'
import { addressSchema } from '@/lib/security/validate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: rawAddress } = await params
  const parsed = addressSchema.safeParse(rawAddress)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }
  const address = parsed.data

  const tier = req.headers.get('x-user-tier') || 'free'
  if (tier === 'free') {
    return NextResponse.json({ error: 'Pro tier required' }, { status: 403 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*, wallet_clusters(*)')
      .eq('address', address)
      .single()

    if (error || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    // Fetch recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('from_address', address)
      .order('block_time', { ascending: false })
      .limit(50)

    // Fetch risk score history
    const { data: riskHistory } = await supabase
      .from('risk_scores')
      .select('score, factors, computed_at')
      .eq('entity_address', address)
      .eq('entity_type', 'wallet')
      .order('computed_at', { ascending: false })
      .limit(10)

    const cluster = wallet.wallet_clusters
      ? {
          id: wallet.cluster_id,
          label: wallet.wallet_clusters.label,
          behaviorTags: wallet.wallet_clusters.behavior_tags,
          riskLevel: wallet.wallet_clusters.risk_level,
          walletCount: wallet.wallet_clusters.wallet_count,
        }
      : null

    const tags: string[] = []
    if (wallet.is_smart_money) tags.push('smart_money')
    if (wallet.is_dev_wallet) tags.push('dev_wallet')
    if (wallet.is_contract) tags.push('contract')
    if (wallet.win_rate && wallet.win_rate > 0.8) tags.push('high_win_rate')
    if (wallet.total_pnl_usd && wallet.total_pnl_usd > 1_000_000) tags.push('whale')

    return NextResponse.json({
      wallet: {
        address: wallet.address,
        chainId: parseInt(wallet.chain),
        label: wallet.label,
        isSmartMoney: wallet.is_smart_money,
        isDevWallet: wallet.is_dev_wallet,
        isContract: wallet.is_contract,
        totalPnlUsd: wallet.total_pnl_usd,
        winRate: wallet.win_rate,
        txCount: wallet.tx_count,
        riskScore: wallet.risk_score ?? 0,
        firstSeenAt: wallet.first_seen_at,
        lastActiveAt: wallet.last_active_at,
        cluster,
        tags,
      },
      transactions: transactions ?? [],
      riskHistory: riskHistory ?? [],
    })
  } catch (err) {
    console.error('[intelligence/wallet] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
