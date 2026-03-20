import { ethers } from 'ethers'

const RPC_URLS: Record<number, string> = {
  1: process.env.ETH_MAINNET_RPC_URL || 'https://eth.llamarpc.com',
  8453: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
  11155111: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
}

const providerCache = new Map<number, ethers.JsonRpcProvider>()

export function getProvider(chainId: number = 1): ethers.JsonRpcProvider {
  if (providerCache.has(chainId)) return providerCache.get(chainId)!

  const url = RPC_URLS[chainId]
  if (!url) throw new Error(`No RPC URL for chain ${chainId}`)

  const provider = new ethers.JsonRpcProvider(url)
  providerCache.set(chainId, provider)
  return provider
}

export function getEthProvider() { return getProvider(1) }
export function getBaseProvider() { return getProvider(8453) }
export function getSepoliaProvider() { return getProvider(11155111) }

export const SUPPORTED_CHAINS = [1, 8453] as const
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]
