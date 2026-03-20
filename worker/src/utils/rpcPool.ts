import { ethers } from 'ethers'
import { logger } from './logger'

interface RpcEndpoint {
  url: string
  weight: number
  failures: number
  lastFailedAt: number | null
}

const RPC_ENDPOINTS: Record<string, RpcEndpoint[]> = {
  '1': [
    { url: process.env.ETH_MAINNET_RPC_URL || 'https://eth.llamarpc.com', weight: 3, failures: 0, lastFailedAt: null },
    { url: 'https://rpc.ankr.com/eth', weight: 2, failures: 0, lastFailedAt: null },
    { url: 'https://cloudflare-eth.com', weight: 1, failures: 0, lastFailedAt: null },
  ],
  '8453': [
    { url: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org', weight: 3, failures: 0, lastFailedAt: null },
    { url: 'https://base.publicnode.com', weight: 1, failures: 0, lastFailedAt: null },
  ],
}

const RECOVERY_MS = 60_000 // 1 minute before retrying a failed RPC
const MAX_FAILURES = 5

function pickEndpoint(chain: string): RpcEndpoint {
  const endpoints = RPC_ENDPOINTS[chain] ?? []
  const now = Date.now()

  // Filter out recently failed endpoints
  const available = endpoints.filter((e) => {
    if (e.failures >= MAX_FAILURES && e.lastFailedAt !== null) {
      return now - e.lastFailedAt > RECOVERY_MS
    }
    return true
  })

  if (available.length === 0) {
    // All endpoints failed — reset and try again
    endpoints.forEach((e) => { e.failures = 0 })
    return endpoints[0]
  }

  // Weighted random selection
  const totalWeight = available.reduce((s, e) => s + e.weight, 0)
  let rand = Math.random() * totalWeight
  for (const endpoint of available) {
    rand -= endpoint.weight
    if (rand <= 0) return endpoint
  }
  return available[0]
}

export function getProvider(chain: string): ethers.JsonRpcProvider {
  const endpoint = pickEndpoint(chain)

  const provider = new ethers.JsonRpcProvider(endpoint.url)

  // Monkey-patch to track failures
  const originalSend = provider.send.bind(provider)
  provider.send = async (method: string, params: unknown[]) => {
    try {
      const result = await originalSend(method, params)
      endpoint.failures = Math.max(0, endpoint.failures - 1) // Recover on success
      return result
    } catch (err) {
      endpoint.failures++
      endpoint.lastFailedAt = Date.now()
      logger.warn(`RPC failure on ${endpoint.url} (chain ${chain}), failures: ${endpoint.failures}`)
      throw err
    }
  }

  return provider
}
