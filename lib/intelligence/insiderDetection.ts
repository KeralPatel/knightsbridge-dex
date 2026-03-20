import { ethers } from 'ethers'
import { getProvider } from '@/lib/ethers/provider'

const DEX_ROUTERS = new Set([
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',  // Uniswap V2
  '0xe592427a0aece92de3edee1f18e0157c05861564',  // Uniswap V3
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',  // Uniswap Universal
  '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',  // Uniswap V2 Base
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff',  // 0x Proxy
  '0x0000000000000000000000000000000000000000',  // Zero address
])

export interface InsiderWallet {
  address: string
  buyTimestamp: number
  blockNumber: number
  tokenAmount: string
  confidence: 'high' | 'medium' | 'low'
}

export interface InsiderDetectionResult {
  hasInsiders: boolean
  insiderCount: number
  insiders: InsiderWallet[]
  confidence: 'high' | 'medium' | 'low'
}

// Detect insider wallets that bought before public launch
export async function detectInsiders(
  tokenAddress: string,
  deployerAddress: string,
  launchTimestamp: number,    // Unix timestamp of public launch
  chainId: number = 1,
  lookbackHours: number = 24
): Promise<InsiderDetectionResult> {
  const provider = getProvider(chainId)
  const windowStart = launchTimestamp - (lookbackHours * 3600)

  const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

  try {
    // Get all Transfer events before launch
    const currentBlock = await provider.getBlockNumber()
    const blocksPerHour = chainId === 8453 ? 1800 : 300  // Base: ~2s blocks, ETH: ~12s
    const fromBlock = Math.max(0, currentBlock - (lookbackHours * blocksPerHour * 2))

    const logs = await provider.getLogs({
      address: tokenAddress,
      topics: [ERC20_TRANSFER_TOPIC],
      fromBlock,
      toBlock: 'latest',
    })

    const insiderMap = new Map<string, InsiderWallet>()

    for (const log of logs) {
      const block = await provider.getBlock(log.blockNumber).catch(() => null)
      if (!block || block.timestamp > launchTimestamp) continue
      if (block.timestamp < windowStart) continue

      const from = '0x' + log.topics[1].slice(26)
      const to = '0x' + log.topics[2].slice(26)
      const amount = BigInt(log.data)

      // Skip: deployer, DEX routers, zero address
      const toLow = to.toLowerCase()
      if (
        toLow === deployerAddress.toLowerCase() ||
        toLow === ethers.ZeroAddress.toLowerCase() ||
        DEX_ROUTERS.has(toLow) ||
        DEX_ROUTERS.has(from.toLowerCase())
      ) continue

      if (!insiderMap.has(toLow)) {
        insiderMap.set(toLow, {
          address: toLow,
          buyTimestamp: block.timestamp,
          blockNumber: log.blockNumber,
          tokenAmount: amount.toString(),
          confidence: block.timestamp < launchTimestamp - 3600 ? 'high' : 'medium',
        })
      }
    }

    const insiders = Array.from(insiderMap.values())
    const hasInsiders = insiders.length >= 3

    return {
      hasInsiders,
      insiderCount: insiders.length,
      insiders,
      confidence: insiders.length >= 5 ? 'high' : insiders.length >= 3 ? 'medium' : 'low',
    }
  } catch {
    return { hasInsiders: false, insiderCount: 0, insiders: [], confidence: 'low' }
  }
}
