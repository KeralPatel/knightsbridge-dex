import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signToken } from '@/lib/security/jwt'
import { signupSchema } from '@/lib/security/validate'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { email, password, username } = parsed.data
    const supabase = createAdminClient()

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // skip email verification for now
    })

    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already')) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      return NextResponse.json({ error: error?.message || 'Signup failed' }, { status: 400 })
    }

    // Create profile
    await supabase.from('user_profiles').insert({
      id: data.user.id,
      email,
      username: username || null,
      tier: 'free',
    })

    const token = await signToken({
      sub: data.user.id,
      email,
      tier: 'free',
    })

    return NextResponse.json({
      token,
      user: { id: data.user.id, email, tier: 'free', username },
    }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
