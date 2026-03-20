import { createServerSupabaseClient } from '@/lib/supabase/admin'

export type SignalTier = 'free' | 'pro' | 'enterprise'

export async function listSignals(params: {
  tier: SignalTier
  chain?: string
  type?: string
  token?: string
  minStrength?: number
  page?: number
  limit?: number
}) {
  const { tier, chain, type, token, minStrength, page = 1, limit = 30 } = params
  const offset = (page - 1) * limit

  const tierFilter: string[] = ['free']
  if (tier === 'pro' || tier === 'enterprise') tierFilter.push('pro')
  if (tier === 'enterprise') tierFilter.push('enterprise')

  const supabase = createServerSupabaseClient()
  let query = supabase
    .from('signals')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .in('tier_required', tierFilter)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (chain) query = query.eq('chain', chain)
  if (type) query = query.eq('type', type)
  if (token) query = query.eq('token_address', token.toLowerCase())
  if (minStrength) query = query.gte('strength', minStrength)

  const { data, error, count } = await query
  if (error) throw error

  return { signals: data ?? [], total: count ?? 0 }
}

export async function getSignalsByToken(tokenAddress: string, tier: SignalTier) {
  const tierFilter: string[] = ['free']
  if (tier === 'pro' || tier === 'enterprise') tierFilter.push('pro')
  if (tier === 'enterprise') tierFilter.push('enterprise')

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .eq('token_address', tokenAddress.toLowerCase())
    .eq('is_active', true)
    .in('tier_required', tierFilter)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return data ?? []
}
