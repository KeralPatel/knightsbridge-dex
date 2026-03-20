import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addressSchema } from '@/lib/security/validate'
import { computeQuickScore } from '@/lib/intelligence/rugScore'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: rawAddr } = await params
  const parsed = addressSchema.safeParse(rawAddr)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid address' }, { status: 400 })

  const address = parsed.data
  const chainId = new URL(req.url).searchParams.get('chainId') || '1'
  const supabase = createAdminClient()

  // Try DB first
  const { data: cached } = await supabase
    .from('risk_scores')
    .select('score, factors, computed_at')
    .eq('entity_address', address)
    .eq('chain', chainId)
    .eq('entity_type', 'token')
    .order('computed_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    const ageMs = Date.now() - new Date(cached.computed_at).getTime()
    if (ageMs < 15 * 60 * 1000) {  // Cache for 15 minutes
      const level =
        cached.score >= 76 ? 'critical' :
        cached.score >= 51 ? 'high' :
        cached.score >= 26 ? 'medium' : 'low'
      return NextResponse.json({ score: cached.score, level, factors: cached.factors, cached: true })
    }
  }

  // Compute quick score from token data
  const { data: token } = await supabase
    .from('tokens')
    .select('is_honeypot, is_verified, risk_score')
    .eq('address', address)
    .eq('chain', chainId)
    .single()

  if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

  if (token.risk_score !== null) {
    const score = token.risk_score
    const level = score >= 76 ? 'critical' : score >= 51 ? 'high' : score >= 26 ? 'medium' : 'low'
    return NextResponse.json({ score, level, factors: null, cached: false })
  }

  const result = computeQuickScore({
    hasLiquidityLock: false,
    isHoneypot: token.is_honeypot || false,
    isVerified: token.is_verified || false,
  })

  return NextResponse.json({ ...result, factors: null, cached: false })
}
