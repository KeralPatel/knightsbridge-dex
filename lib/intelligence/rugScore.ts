import { ethers } from 'ethers'
import { getProvider } from '@/lib/ethers/provider'
import { getUniswapV2Factory, getUniswapV2Pair, getERC20, CONTRACT_ADDRESSES } from '@/lib/ethers/contracts'

export interface RugScoreFactors {
  liquidityLock: number        // 0–25
  devWalletSells: number       // 0–20
  honeypot: number             // 0–20
  holderConcentration: number  // 0–15
  fakeLiquidity: number        // 0–10
  contractVerification: number // 0–5
  insiderActivity: number      // 0–5
}

export interface RiskScoreResult {
  score: number          // 0–100
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: RugScoreFactors
  details: {
    liquidityUsd: number
    marketCapUsd: number
    holderCount: number
    topHolderPercent: number
    isHoneypot: boolean
    hasLiquidityLock: boolean
    lockExpiryDays: number
  }
}

export function scoreToLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 25) return 'low'
  if (score <= 50) return 'medium'
  if (score <= 75) return 'high'
  return 'critical'
}

export async function computeRugScore(
  tokenAddress: string,
  chainId: number = 1,
  overrides?: Partial<{
    lpLocked: boolean
    lockExpiryDays: number
    holderPercents: number[]
    isHoneypot: boolean
    isVerified: boolean
    deployerSellPercent7d: number
    hasInsiderBuys: boolean
    hasFakeLp: boolean
  }>
): Promise<RiskScoreResult> {
  const provider = getProvider(chainId)
  const factors: RugScoreFactors = {
    liquidityLock: 0,
    devWalletSells: 0,
    honeypot: 0,
    holderConcentration: 0,
    fakeLiquidity: 0,
    contractVerification: 0,
    insiderActivity: 0,
  }

  const details = {
    liquidityUsd: 0,
    marketCapUsd: 0,
    holderCount: 0,
    topHolderPercent: 0,
    isHoneypot: false,
    hasLiquidityLock: false,
    lockExpiryDays: 0,
  }

  // ─── 1. Liquidity Lock (25 pts) ───────────────────────────────────────────
  const locked = overrides?.lpLocked ?? false
  const lockDays = overrides?.lockExpiryDays ?? 0
  details.hasLiquidityLock = locked
  details.lockExpiryDays = lockDays

  if (!locked) {
    factors.liquidityLock = 25
  } else if (lockDays < 30) {
    factors.liquidityLock = 15
  } else if (lockDays < 180) {
    factors.liquidityLock = 8
  } else {
    factors.liquidityLock = 0
  }

  // ─── 2. Dev Wallet Sells (20 pts) ─────────────────────────────────────────
  const devSellPercent = overrides?.deployerSellPercent7d ?? 0
  if (devSellPercent >= 10) factors.devWalletSells = 15
  else if (devSellPercent >= 5) factors.devWalletSells = 8
  else factors.devWalletSells = 0

  // ─── 3. Honeypot (20 pts) ─────────────────────────────────────────────────
  const isHoneypot = overrides?.isHoneypot ?? false
  details.isHoneypot = isHoneypot
  if (isHoneypot) factors.honeypot = 20

  // ─── 4. Holder Concentration (15 pts) ────────────────────────────────────
  const holders = overrides?.holderPercents ?? []
  const top10 = holders.slice(0, 10).reduce((a, b) => a + b, 0)
  details.topHolderPercent = top10
  if (top10 >= 80) factors.holderConcentration = 15
  else if (top10 >= 60) factors.holderConcentration = 10
  else if (top10 >= 40) factors.holderConcentration = 5

  // ─── 5. Fake Liquidity (10 pts) ────────────────────────────────────────────
  const hasFakeLp = overrides?.hasFakeLp ?? false
  if (hasFakeLp) factors.fakeLiquidity = 10

  // ─── 6. Contract Verification (5 pts) ────────────────────────────────────
  const isVerified = overrides?.isVerified ?? false
  if (!isVerified) factors.contractVerification = 5

  // ─── 7. Insider Activity (5 pts) ──────────────────────────────────────────
  const hasInsiders = overrides?.hasInsiderBuys ?? false
  if (hasInsiders) factors.insiderActivity = 5

  // ─── Total ────────────────────────────────────────────────────────────────
  const score = Math.min(100, Object.values(factors).reduce((a, b) => a + b, 0))
  const level = scoreToLevel(score)

  return { score, level, factors, details }
}

// ─── Simplified scorer for API use (no on-chain calls) ───────────────────────
export function computeQuickScore(data: {
  hasLiquidityLock: boolean
  lockDays?: number
  isHoneypot?: boolean
  isVerified?: boolean
  top10HolderPercent?: number
  devSellPercent?: number
  hasInsiderBuys?: boolean
}): { score: number; level: 'low' | 'medium' | 'high' | 'critical' } {
  let score = 0
  if (!data.hasLiquidityLock) score += 25
  else if ((data.lockDays ?? 0) < 30) score += 15
  else if ((data.lockDays ?? 0) < 180) score += 8

  if (data.isHoneypot) score += 20
  if (!data.isVerified) score += 5
  if ((data.devSellPercent ?? 0) >= 10) score += 15
  else if ((data.devSellPercent ?? 0) >= 5) score += 8

  const t = data.top10HolderPercent ?? 0
  if (t >= 80) score += 15
  else if (t >= 60) score += 10
  else if (t >= 40) score += 5

  if (data.hasInsiderBuys) score += 5

  score = Math.min(100, score)
  return { score, level: scoreToLevel(score) }
}
