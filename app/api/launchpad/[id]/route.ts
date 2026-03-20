import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 })
  }

  try {
    const supabase = createServerSupabaseClient()

    const { data: listing, error } = await supabase
      .from('launchpad_listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Fetch associated token risk if token is deployed
    let riskScore = listing.risk_score
    if (listing.token_address && listing.token_chain) {
      const { data: riskData } = await supabase
        .from('risk_scores')
        .select('score, factors, computed_at')
        .eq('entity_address', listing.token_address)
        .eq('entity_type', 'token')
        .order('computed_at', { ascending: false })
        .limit(1)
        .single()

      if (riskData) riskScore = riskData.score
    }

    return NextResponse.json({ listing, riskScore })
  } catch (err) {
    console.error('[launchpad/[id]] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = createServerSupabaseClient()

    // Only allow updating own listings
    const { data: listing } = await supabase
      .from('launchpad_listings')
      .select('creator_user')
      .eq('id', id)
      .single()

    if (!listing || listing.creator_user !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const allowedFields = ['description', 'logo_url', 'metadata']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }
    updates.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from('launchpad_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ listing: updated })
  } catch (err) {
    console.error('[launchpad/[id] PATCH] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
