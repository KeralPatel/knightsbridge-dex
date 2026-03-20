import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { signalQuerySchema } from '@/lib/security/validate'

export async function GET(req: NextRequest) {
  const tier = (req.headers.get('x-user-tier') || 'free') as 'free' | 'pro' | 'enterprise'
  const { searchParams } = new URL(req.url)

  const parsed = signalQuerySchema.safeParse({
    chain: searchParams.get('chain') || undefined,
    type: searchParams.get('type') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    token: searchParams.get('token') || undefined,
    minStrength: searchParams.get('minStrength') ? parseInt(searchParams.get('minStrength')!) : undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { chain, type, page = 1, limit = 30, token, minStrength } = parsed.data
  const offset = (page - 1) * limit

  // Tier visibility: free sees free-tier signals, pro sees free+pro, enterprise sees all
  const tierFilter: string[] = ['free']
  if (tier === 'pro' || tier === 'enterprise') tierFilter.push('pro')
  if (tier === 'enterprise') tierFilter.push('enterprise')

  try {
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

    const { data: signals, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      signals: signals ?? [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('[signals] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
