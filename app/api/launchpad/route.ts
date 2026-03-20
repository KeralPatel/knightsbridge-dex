import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createListingSchema } from '@/lib/security/validate'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const chain = searchParams.get('chain')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = (page - 1) * limit

  const supabase = createAdminClient()
  let query = supabase
    .from('launchpad_listings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (chain) query = query.eq('token_chain', chain)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })

  return NextResponse.json({ listings: data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const body = await req.json()

  const parsed = createListingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = createAdminClient()
  const data = parsed.data

  const { data: listing, error } = await supabase
    .from('launchpad_listings')
    .insert({
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      total_supply: data.totalSupply,
      creator_wallet: data.creatorWallet,
      creator_user: userId,
      token_chain: data.chainId.toString(),
      liquidity_eth: data.liquidityEth ? parseFloat(data.liquidityEth) : null,
      lock_duration_days: data.lockDurationDays,
      launch_at: data.launchAt,
      status: 'pending',
      risk_score: 50,  // Will be updated by worker
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  return NextResponse.json({ listing }, { status: 201 })
}
