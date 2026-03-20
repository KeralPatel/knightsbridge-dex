import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, username, tier, tier_expires_at, created_at')
    .eq('id', userId)
    .single()

  if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json({ profile: data })
}

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const body = await req.json()
  const supabase = createAdminClient()

  const allowed = ['username']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 400 })
  return NextResponse.json({ profile: data })
}
