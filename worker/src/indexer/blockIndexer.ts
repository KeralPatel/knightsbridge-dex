import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
import { getProvider } from '../utils/rpcPool'
import { withRetry } from '../utils/retry'
import { logger } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 50 // Blocks per batch
const MAX_LAG = 500   // Max blocks behind before fast-forward

export class BlockIndexer {
  async processLatestBlocks(chain: string): Promise<void> {
    const provider = getProvider(chain)

    // Get checkpoint
    const { data: checkpoint } = await supabase
      .from('indexer_checkpoints')
      .select('last_block')
      .eq('chain', chain)
      .single()

    const lastBlock = checkpoint?.last_block ?? 0

    // Get current block
    const currentBlock = await withRetry(() => provider.getBlockNumber())
    const targetBlock = currentBlock - 2 // 2 block safety margin

    if (lastBlock >= targetBlock) return // Already up to date

    const fromBlock = lastBlock + 1
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, targetBlock)

    logger.info(`[Indexer] Chain ${chain}: blocks ${fromBlock}–${toBlock} (current: ${currentBlock})`)

    await this.processBlockRange(chain, provider, fromBlock, toBlock)

    // Update checkpoint
    await supabase
      .from('indexer_checkpoints')
      .update({ last_block: toBlock, updated_at: new Date().toISOString() })
      .eq('chain', chain)
  }

  private async processBlockRange(
    chain: string,
    provider: ethers.JsonRpcProvider,
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    // Fetch ERC20 Transfer events
    const transferTopic = ethers.id('Transfer(address,address,uint256)')

    const logs = await withRetry(() =>
      provider.getLogs({
        fromBlock,
        toBlock,
        topics: [transferTopic],
      })
    )

    if (logs.length === 0) return

    logger.debug(`[Indexer] Chain ${chain}: ${logs.length} Transfer events`)

    // Group by transaction hash
    const txGroups = new Map<string, ethers.Log[]>()
    for (const log of logs) {
      const group = txGroups.get(log.transactionHash) ?? []
      group.push(log)
      txGroups.set(log.transactionHash, group)
    }

    // Process each unique transaction
    const txRows: Record<string, unknown>[] = []
    for (const [hash, txLogs] of txGroups) {
      try {
        const receipt = await withRetry(() => provider.getTransactionReceipt(hash))
        if (!receipt) continue

        const block = await withRetry(() => provider.getBlock(receipt.blockNumber))
        if (!block) continue

        // Decode first Transfer event as the primary token transfer
        const primaryLog = txLogs[0]
        const iface = new ethers.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)'])
        const decoded = iface.parseLog({ topics: Array.from(primaryLog.topics), data: primaryLog.data })
        if (!decoded) continue

        txRows.push({
          hash,
          chain,
          block_number: receipt.blockNumber,
          block_time: new Date(block.timestamp * 1000).toISOString(),
          from_address: (decoded.args[0] as string).toLowerCase(),
          to_address: (decoded.args[1] as string).toLowerCase(),
          token_address: primaryLog.address.toLowerCase(),
          token_chain: chain,
          gas_used: Number(receipt.gasUsed),
          tx_type: 'transfer',
        })
      } catch (err) {
        logger.debug(`[Indexer] Skipping tx ${hash}: ${err}`)
      }
    }

    if (txRows.length > 0) {
      await supabase
        .from('transactions')
        .upsert(txRows, { onConflict: 'hash,chain', ignoreDuplicates: true })
    }
  }
}
