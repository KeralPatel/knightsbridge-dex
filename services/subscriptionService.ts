import { createServerSupabaseClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

const TIER_RANK: Record<SubscriptionTier, number> = { free: 0, pro: 1, enterprise: 2 }

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('tier, tier_expires_at')
    .eq('id', userId)
    .single()

  if (!data) return 'free'

  // Check expiry
  if (data.tier !== 'free' && data.tier_expires_at) {
    const expired = new Date(data.tier_expires_at) < new Date()
    if (expired) {
      // Downgrade to free
      await supabase
        .from('user_profiles')
        .update({ tier: 'free', updated_at: new Date().toISOString() })
        .eq('id', userId)
      return 'free'
    }
  }

  return (data.tier as SubscriptionTier) ?? 'free'
}

export async function hasAccess(
  userId: string,
  requiredTier: SubscriptionTier
): Promise<boolean> {
  const tier = await getUserTier(userId)
  return TIER_RANK[tier] >= TIER_RANK[requiredTier]
}

export async function upgradeTier(
  userId: string,
  newTier: SubscriptionTier,
  durationDays: number
) {
  const supabase = createServerSupabaseClient()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + durationDays)

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      tier: newTier,
      tier_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export interface SubscriptionInfo {
  tier: SubscriptionTier
  tierExpiresAt: string | null
  isActive: boolean
  daysRemaining: number | null
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('tier, tier_expires_at')
    .eq('id', userId)
    .single()

  if (!data) return { tier: 'free', tierExpiresAt: null, isActive: false, daysRemaining: null }

  let daysRemaining: number | null = null
  let isActive = data.tier !== 'free'

  if (data.tier_expires_at) {
    const ms = new Date(data.tier_expires_at).getTime() - Date.now()
    if (ms <= 0) {
      isActive = false
    } else {
      daysRemaining = Math.ceil(ms / (1000 * 60 * 60 * 24))
    }
  }

  return {
    tier: data.tier as SubscriptionTier,
    tierExpiresAt: data.tier_expires_at,
    isActive,
    daysRemaining,
  }
}
