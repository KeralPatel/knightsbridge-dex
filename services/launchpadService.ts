import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface CreateListingInput {
  name: string
  symbol: string
  description?: string
  logoUrl?: string
  totalSupply: string
  creatorWallet: string
  creatorUser?: string
  launchAt?: string
  liquidityEth?: number
  lockDurationDays?: number
  raiseTargetEth?: number
  metadata?: Record<string, unknown>
}

export async function createListing(input: CreateListingInput) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('launchpad_listings')
    .insert({
      name: input.name,
      symbol: input.symbol.toUpperCase(),
      description: input.description,
      logo_url: input.logoUrl,
      total_supply: input.totalSupply,
      creator_wallet: input.creatorWallet.toLowerCase(),
      creator_user: input.creatorUser,
      launch_at: input.launchAt,
      liquidity_eth: input.liquidityEth,
      lock_duration_days: input.lockDurationDays,
      raise_target_eth: input.raiseTargetEth,
      metadata: input.metadata ?? {},
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listListings(params: {
  status?: string
  page?: number
  limit?: number
}) {
  const { status, page = 1, limit = 20 } = params
  const offset = (page - 1) * limit
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('launchpad_listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) throw error
  return { listings: data ?? [], total: count ?? 0 }
}

export async function updateListingAfterDeploy(
  id: string,
  tokenAddress: string,
  chain: string,
  deployTx: string
) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('launchpad_listings')
    .update({
      token_address: tokenAddress.toLowerCase(),
      token_chain: chain,
      deploy_tx: deployTx,
      status: 'live',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
