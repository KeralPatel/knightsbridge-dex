import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getOrCreateWallet(address: string, chain: string) {
  const supabase = createServerSupabaseClient()
  const normalized = address.toLowerCase()

  const { data: existing } = await supabase
    .from('wallets')
    .select('*')
    .eq('address', normalized)
    .eq('chain', chain)
    .single()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('wallets')
    .insert({ address: normalized, chain, first_seen_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return created
}

export async function getSmartMoneyWallets(params: {
  chain?: string
  page?: number
  limit?: number
}) {
  const { chain = '1', page = 1, limit = 20 } = params
  const offset = (page - 1) * limit
  const supabase = createServerSupabaseClient()

  const { data, error, count } = await supabase
    .from('wallets')
    .select('*', { count: 'exact' })
    .eq('is_smart_money', true)
    .eq('chain', chain)
    .order('total_pnl_usd', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { wallets: data ?? [], total: count ?? 0 }
}

export async function classifyWallet(address: string, chain: string) {
  const supabase = createServerSupabaseClient()
  const normalized = address.toLowerCase()

  // Fetch the wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('address', normalized)
    .eq('chain', chain)
    .single()

  if (!wallet) return null

  const winRate = wallet.win_rate ?? 0
  const totalPnl = wallet.total_pnl_usd ?? 0
  const txCount = wallet.tx_count ?? 0

  const isSmartMoney =
    winRate > 0.65 &&
    totalPnl > 100_000 &&
    txCount > 50

  if (wallet.is_smart_money !== isSmartMoney) {
    await supabase
      .from('wallets')
      .update({ is_smart_money: isSmartMoney, updated_at: new Date().toISOString() })
      .eq('address', normalized)
      .eq('chain', chain)
  }

  return { ...wallet, is_smart_money: isSmartMoney }
}
