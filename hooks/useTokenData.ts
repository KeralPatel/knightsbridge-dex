'use client'

import useSWR from 'swr'

interface TokenData {
  address: string
  chain: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  deployer: string | null
  priceUsd: number | null
  marketCapUsd: number | null
  volume24hUsd: number | null
  liquidityUsd: number | null
  holderCount: number | null
  priceChange1h: number | null
  priceChange24h: number | null
  isVerified: boolean
  isHoneypot: boolean | null
  hasFakeLp: boolean | null
  riskScore: number | null
  riskLevel: string | null
}

interface HoldersData {
  holders: Array<{
    address: string
    amount: string
    percentage: number
    label: string | null
    isSmartMoney: boolean
    isDevWallet: boolean
  }>
  distribution: {
    top10Pct: number
    top20Pct: number
    top50Pct: number
  }
}

interface RiskData {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: Record<string, unknown>
}

export function useTokenData(address: string | null, chain = '1') {
  const { data, error, isLoading } = useSWR<{ token: TokenData }>(
    address ? `/api/tokens/${address}?chain=${chain}` : null,
    { refreshInterval: 30_000 }
  )

  const { data: holdersData, isLoading: isLoadingHolders } = useSWR<HoldersData>(
    address ? `/api/tokens/${address}/holders?chain=${chain}` : null,
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
  )

  const { data: riskData, isLoading: isLoadingRisk } = useSWR<RiskData>(
    address ? `/api/tokens/${address}/risk?chain=${chain}` : null,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  )

  return {
    token: data?.token ?? null,
    holders: holdersData?.holders ?? [],
    distribution: holdersData?.distribution ?? null,
    risk: riskData ?? null,
    isLoading,
    isLoadingHolders,
    isLoadingRisk,
    error,
  }
}
