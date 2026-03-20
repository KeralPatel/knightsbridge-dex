import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addressSchema } from '@/lib/security/validate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: rawAddr } = await params
  const parsed = addressSchema.safeParse(rawAddr)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
  }

  const address = parsed.data
  const { searchParams } = new URL(req.url)
  const chainId = searchParams.get('chainId') || '1'

  const supabase = createAdminClient()

  const [tokenResult, riskResult, signalsResult] = await Promise.all([
    supabase
      .from('tokens')
      .select('*')
      .eq('address', address)
      .eq('chain', chainId)
      .single(),
    supabase
      .from('risk_scores')
      .select('score, factors, computed_at')
      .eq('entity_address', address)
      .eq('chain', chainId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('signals')
      .select('id, type, title, strength, created_at, tier_required')
      .eq('token_address', address)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (!tokenResult.data) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  }

  return NextResponse.json({
    token: tokenResult.data,
    riskScore: riskResult.data,
    recentSignals: signalsResult.data || [],
  })
}
