import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface TokenRow {
  address: string
  chain: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string | null
  deployer: string | null
  priceUsd: number | null
  marketCapUsd: number | null
  volume24hUsd: number | null
  liquidityUsd: number | null
  holderCount: number | null
  priceChange1h: number | null
  priceChange24h: number | null
  isVerified: boolean
  isHoneypot: boolean | null
  hasFakeLp: boolean | null
  riskScore: number | null
  riskLevel: string | null
  createdAt: string
}

function rowToToken(row: Record<string, unknown>): TokenRow {
  return {
    address: row.address as string,
    chain: row.chain as string,
    name: row.name as string,
    symbol: row.symbol as string,
    decimals: row.decimals as number,
    totalSupply: row.total_supply as string | null,
    deployer: row.deployer as string | null,
    priceUsd: row.price_usd as number | null,
    marketCapUsd: row.market_cap_usd as number | null,
    volume24hUsd: row.volume_24h_usd as number | null,
    liquidityUsd: row.liquidity_usd as number | null,
    holderCount: row.holder_count as number | null,
    priceChange1h: row.price_change_1h as number | null,
    priceChange24h: row.price_change_24h as number | null,
    isVerified: row.is_verified as boolean,
    isHoneypot: row.is_honeypot as boolean | null,
    hasFakeLp: row.has_fake_lp as boolean | null,
    riskScore: row.risk_score as number | null,
    riskLevel: row.risk_level as string | null,
    createdAt: row.created_at as string,
  }
}

export async function listTokens(params: {
  chain?: string
  q?: string
  sort?: string
  page?: number
  limit?: number
}) {
  const supabase = createServerSupabaseClient()
  const { chain = '1', q, sort = 'volume', page = 1, limit = 20 } = params
  const offset = (page - 1) * limit

  let query = supabase
    .from('tokens')
    .select('*', { count: 'exact' })
    .eq('chain', chain)
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`symbol.ilike.%${q}%,name.ilike.%${q}%`)
  }

  if (sort === 'volume') query = query.order('volume_24h_usd', { ascending: false, nullsFirst: false })
  else if (sort === 'mcap') query = query.order('market_cap_usd', { ascending: false, nullsFirst: false })
  else if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else if (sort === 'risk') query = query.order('risk_score', { ascending: false, nullsFirst: false })

  const { data, error, count } = await query
  if (error) throw error

  return {
    tokens: (data ?? []).map(rowToToken),
    total: count ?? 0,
  }
}

export async function getToken(address: string, chain: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('address', address.toLowerCase())
    .eq('chain', chain)
    .single()

  if (error) throw error
  if (!data) return null
  return rowToToken(data)
}

export async function getTokenHolders(address: string, chain: string) {
  // In production, this would query an indexed holders table or on-chain data
  // For now, returns mock structured data for UI dev
  return {
    holders: [] as Array<{
      address: string
      amount: string
      percentage: number
      label: string | null
      isSmartMoney: boolean
      isDevWallet: boolean
    }>,
    distribution: { top10Pct: 0, top20Pct: 0, top50Pct: 0 },
  }
}
