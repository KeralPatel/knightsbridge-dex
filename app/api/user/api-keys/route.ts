import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey, hashApiKey } from '@/lib/security/apiKey'
import { createApiKeySchema } from '@/lib/security/validate'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, tier, rate_limit_rpm, last_used_at, usage_count, is_active, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 })
  return NextResponse.json({ keys: data })
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const userTier = req.headers.get('x-user-tier') || 'free'
  const body = await req.json()

  const parsed = createApiKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Tier limits
  const MAX_KEYS: Record<string, number> = { free: 1, pro: 5, enterprise: 20 }
  const RPM_LIMITS: Record<string, number> = { free: 30, pro: 60, enterprise: 1000 }

  const supabase = createAdminClient()

  // Check key count
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  if ((count ?? 0) >= (MAX_KEYS[userTier] ?? 1)) {
    return NextResponse.json(
      { error: `${userTier} tier limited to ${MAX_KEYS[userTier]} API keys` },
      { status: 403 }
    )
  }

  const { key, prefix } = generateApiKey()
  const keyHash = await hashApiKey(key)

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name: parsed.data.name,
      key_hash: keyHash,
      key_prefix: prefix,
      tier: userTier,
      rate_limit_rpm: RPM_LIMITS[userTier] ?? 30,
    })
    .select('id, name, key_prefix')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })

  // Return full key once — never stored in plaintext
  return NextResponse.json({ key, id: data.id, prefix: data.key_prefix }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const { searchParams } = new URL(req.url)
  const keyId = searchParams.get('id')

  if (!keyId) return NextResponse.json({ error: 'Key ID required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId)  // security: user can only delete own keys

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
