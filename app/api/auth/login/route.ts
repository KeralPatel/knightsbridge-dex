import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signToken } from '@/lib/security/jwt'
import { loginSchema } from '@/lib/security/validate'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email, password } = parsed.data
    const supabase = createAdminClient()

    // Auth via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, username')
      .eq('id', data.user.id)
      .single()

    const token = await signToken({
      sub: data.user.id,
      email: data.user.email!,
      tier: profile?.tier || 'free',
    })

    return NextResponse.json({
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        tier: profile?.tier || 'free',
        username: profile?.username,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
