import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tokenQuerySchema } from '@/lib/security/validate'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = tokenQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { q, chain, sort, page, limit } = parsed.data
  const offset = (page - 1) * limit
  const supabase = createAdminClient()

  let query = supabase
    .from('tokens')
    .select('address, chain, name, symbol, price_usd, market_cap_usd, volume_24h_usd, liquidity_usd, risk_score, risk_level, price_change_24h, holder_count, is_honeypot', { count: 'exact' })
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`symbol.ilike.%${q}%,name.ilike.%${q}%`)
  }
  if (chain) {
    query = query.eq('chain', chain.toString())
  }

  const orderMap: Record<string, { column: string; ascending: boolean }> = {
    volume: { column: 'volume_24h_usd', ascending: false },
    risk: { column: 'risk_score', ascending: false },
    newest: { column: 'created_at', ascending: false },
    market_cap: { column: 'market_cap_usd', ascending: false },
  }
  const order = orderMap[sort] || orderMap.volume
  query = query.order(order.column, { ascending: order.ascending, nullsFirst: false })

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  return NextResponse.json({ tokens: data, total: count, page, limit })
}
