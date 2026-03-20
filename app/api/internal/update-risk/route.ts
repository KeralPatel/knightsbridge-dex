import { NextRequest, NextResponse } from 'next/server'
import { verifyWorkerRequest } from '@/lib/security/hmac'
import { createServerSupabaseClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateRiskSchema = z.object({
  entityType: z.enum(['token', 'wallet']),
  entityAddress: z.string().toLowerCase(),
  chain: z.enum(['1', '8453']),
  score: z.number().int().min(0).max(100),
  factors: z.record(z.unknown()),
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-worker-signature') || ''
  const timestamp = req.headers.get('x-worker-timestamp') || ''

  const isValid = verifyWorkerRequest(body, signature, timestamp)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateRiskSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { entityType, entityAddress, chain, score, factors } = parsed.data
  const level =
    score >= 76 ? 'critical' : score >= 51 ? 'high' : score >= 26 ? 'medium' : 'low'

  try {
    const supabase = createServerSupabaseClient()

    // Insert audit record
    await supabase.from('risk_scores').insert({
      entity_type: entityType,
      entity_address: entityAddress,
      chain,
      score,
      factors,
    })

    // Update live record on the entity table
    if (entityType === 'token') {
      await supabase
        .from('tokens')
        .update({
          risk_score: score,
          risk_level: level,
          updated_at: new Date().toISOString(),
        })
        .eq('address', entityAddress)
        .eq('chain', chain)
    } else if (entityType === 'wallet') {
      await supabase
        .from('wallets')
        .update({
          risk_score: score,
          updated_at: new Date().toISOString(),
        })
        .eq('address', entityAddress)
        .eq('chain', chain)
    }

    return NextResponse.json({ success: true, score, level })
  } catch (err) {
    console.error('[internal/update-risk] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
