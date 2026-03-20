import { NextRequest, NextResponse } from 'next/server'
import { verifyWorkerRequest } from '@/lib/security/hmac'
import { ingestSignalSchema } from '@/lib/security/validate'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // HMAC authentication — only allow requests from the worker
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

  const parsed = ingestSignalSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const signal = parsed.data

  try {
    const supabase = createServerSupabaseClient()

    // Deduplication: check if identical signal exists in last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('signals')
      .select('id')
      .eq('type', signal.type)
      .eq('chain', signal.chain)
      .eq('token_address', signal.tokenAddress ?? null)
      .gte('created_at', fiveMinAgo)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, deduplicated: true, id: existing.id })
    }

    const { data: inserted, error } = await supabase
      .from('signals')
      .insert({
        type: signal.type,
        chain: signal.chain,
        token_address: signal.tokenAddress,
        wallet_address: signal.walletAddress,
        title: signal.title,
        description: signal.description,
        strength: signal.strength,
        tier_required: signal.tierRequired ?? 'free',
        metadata: signal.metadata ?? {},
        tx_hash: signal.txHash,
        block_number: signal.blockNumber,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: inserted.id })
  } catch (err) {
    console.error('[internal/ingest-signal] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
