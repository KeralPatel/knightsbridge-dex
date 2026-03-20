'use client'

import useSWR from 'swr'

interface Subscription {
  tier: 'free' | 'pro' | 'enterprise'
  tierExpiresAt: string | null
  isActive: boolean
}

const TIER_RANK: Record<string, number> = { free: 0, pro: 1, enterprise: 2 }

export function useSubscription() {
  const { data, error, isLoading } = useSWR<{ profile: Subscription }>(
    '/api/user/profile',
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const tier = data?.profile?.tier ?? 'free'

  return {
    tier,
    tierExpiresAt: data?.profile?.tierExpiresAt ?? null,
    isActive: data?.profile?.isActive ?? false,
    isLoading,
    error,
    hasAccess: (requiredTier: 'free' | 'pro' | 'enterprise') =>
      TIER_RANK[tier] >= TIER_RANK[requiredTier],
    isPro: tier === 'pro' || tier === 'enterprise',
    isEnterprise: tier === 'enterprise',
  }
}
