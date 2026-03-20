import { ethers } from 'ethers'
import { getProvider } from '../../utils/rpcPool'
import { withRetry } from '../../utils/retry'
import { DetectedSignal } from './largeTransfer'
import { logger } from '../../utils/logger'

// Uniswap V2 events
const BURN_TOPIC = ethers.id('Burn(address,uint256,uint256,address)')
const SYNC_TOPIC = ethers.id('Sync(uint112,uint112)')

const SIGNIFICANT_REMOVAL_USD = 50_000

export async function detectLiquidityRemoval(chain: string): Promise<DetectedSignal[]> {
  const provider = getProvider(chain)
  const currentBlock = await withRetry(() => provider.getBlockNumber())

  const logs = await withRetry(() =>
    provider.getLogs({
      fromBlock: currentBlock - 10,
      toBlock: currentBlock,
      topics: [BURN_TOPIC],
    })
  )

  if (logs.length === 0) return []

  const signals: DetectedSignal[] = []

  for (const log of logs) {
    try {
      const iface = new ethers.Interface([
        'event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
      ])
      const decoded = iface.parseLog({ topics: Array.from(log.topics), data: log.data })
      if (!decoded) continue

      const amount0 = decoded.args[1] as bigint
      const amount1 = decoded.args[2] as bigint

      // Simple heuristic: if amount0 or amount1 > 1 ETH in wei equivalent, flag it
      const THRESHOLD = ethers.parseEther('1')
      if (amount0 < THRESHOLD && amount1 < THRESHOLD) continue

      signals.push({
        type: 'liquidity_removal',
        chain,
        title: `Liquidity removed from ${log.address.slice(0, 8)}... pair`,
        description: `Large LP withdrawal detected from Uniswap V2 pair`,
        strength: 75,
        tierRequired: 'free',
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        metadata: {
          pairAddress: log.address,
          amount0: amount0.toString(),
          amount1: amount1.toString(),
        },
      })
    } catch (err) {
      logger.debug(`[LiquidityRemoval] Failed to decode log: ${err}`)
    }
  }

  return signals
}
