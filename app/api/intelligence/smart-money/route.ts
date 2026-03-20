import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { walletQuerySchema } from '@/lib/security/validate'

export async function GET(req: NextRequest) {
  const tier = req.headers.get('x-user-tier') || 'free'
  if (tier === 'free') {
    return NextResponse.json({ error: 'Pro tier required' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = walletQuerySchema.safeParse({
    chain: searchParams.get('chain') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { chain = '1', page = 1, limit = 20 } = parsed.data
  const offset = (page - 1) * limit

  try {
    const supabase = createServerSupabaseClient()

    const query = supabase
      .from('wallets')
      .select('*', { count: 'exact' })
      .eq('is_smart_money', true)
      .order('total_pnl_usd', { ascending: false })
      .range(offset, offset + limit - 1)

    if (chain) {
      query.eq('chain', chain)
    }

    const { data: wallets, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      wallets: (wallets ?? []).map((w) => ({
        address: w.address,
        label: w.label,
        totalPnlUsd: w.total_pnl_usd,
        winRate: w.win_rate,
        txCount: w.tx_count,
        riskScore: w.risk_score,
        lastActiveAt: w.last_active_at,
        clusterId: w.cluster_id,
        score: Math.min(
          100,
          Math.round(
            (w.win_rate ?? 0) * 50 +
              Math.min(50, Math.log10(Math.max(1, w.total_pnl_usd ?? 1)) * 10)
          )
        ),
      })),
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('[intelligence/smart-money] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
