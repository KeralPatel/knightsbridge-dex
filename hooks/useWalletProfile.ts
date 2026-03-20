'use client'

import useSWR from 'swr'

interface WalletProfile {
  address: string
  chainId: number
  label: string | null
  isSmartMoney: boolean
  isDevWallet: boolean
  totalPnlUsd: number | null
  winRate: number | null
  txCount: number
  riskScore: number
  firstSeenAt: string | null
  lastActiveAt: string | null
  cluster: {
    id: number
    label: string | null
    behaviorTags: string[]
    riskLevel: string | null
  } | null
  tags: string[]
}

export function useWalletProfile(address: string | null, chainId = 1) {
  const { data, error, isLoading } = useSWR<{
    wallet: WalletProfile
    transactions: unknown[]
    riskHistory: unknown[]
  }>(address ? `/api/intelligence/wallet/${address}?chain=${chainId}` : null, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  return {
    wallet: data?.wallet ?? null,
    transactions: data?.transactions ?? [],
    riskHistory: data?.riskHistory ?? [],
    isLoading,
    error,
  }
}
