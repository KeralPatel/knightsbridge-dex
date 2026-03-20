import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_FEATURES = {
  free: {
    signals: 'Basic signals only',
    walletIntelligence: false,
    advancedSignals: false,
    apiAccess: true,
    apiRpm: 30,
    maxApiKeys: 1,
  },
  pro: {
    signals: 'All signals including insider detection',
    walletIntelligence: true,
    advancedSignals: true,
    apiAccess: true,
    apiRpm: 60,
    maxApiKeys: 5,
  },
  enterprise: {
    signals: 'All signals + custom alerts',
    walletIntelligence: true,
    advancedSignals: true,
    apiAccess: true,
    apiRpm: 1000,
    maxApiKeys: 20,
  },
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('tier, tier_expires_at')
    .eq('id', userId)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tier = data.tier as keyof typeof TIER_FEATURES
  const features = TIER_FEATURES[tier] || TIER_FEATURES.free

  return NextResponse.json({
    tier,
    expiresAt: data.tier_expires_at,
    features,
    pricing: {
      free: '$0/mo',
      pro: '$99/mo USDT',
      enterprise: '$499/mo USDT',
    },
    paymentWallet: '0xYourUSDTReceivingWalletHere',  // Replace with real wallet
  })
}
