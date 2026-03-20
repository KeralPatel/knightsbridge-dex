import * as crypto from 'crypto'
import { DetectedSignal } from './detectors/largeTransfer'
import { logger } from '../utils/logger'
import { withRetry } from '../utils/retry'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000'
const HMAC_SECRET = process.env.WORKER_HMAC_SECRET || ''

function signPayload(body: string): { signature: string; timestamp: string } {
  const timestamp = Date.now().toString()
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex')
  return { signature, timestamp }
}

export class SignalBroadcaster {
  private recentHashes = new Set<string>()

  private dedup(signal: DetectedSignal): boolean {
    // Hash key: type + chain + token + 5-minute window
    const window = Math.floor(Date.now() / (5 * 60 * 1000))
    const key = `${signal.type}:${signal.chain}:${signal.tokenAddress ?? ''}:${window}`
    if (this.recentHashes.has(key)) return true
    this.recentHashes.add(key)

    // Clean up old entries every 1000 signals
    if (this.recentHashes.size > 1000) {
      const arr = Array.from(this.recentHashes)
      this.recentHashes = new Set(arr.slice(-500))
    }

    return false
  }

  async broadcast(signals: DetectedSignal[]): Promise<void> {
    for (const signal of signals) {
      if (this.dedup(signal)) {
        logger.debug(`[Broadcaster] Deduped signal: ${signal.type} for ${signal.tokenAddress}`)
        continue
      }

      try {
        const body = JSON.stringify({
          type: signal.type,
          chain: signal.chain,
          tokenAddress: signal.tokenAddress,
          walletAddress: signal.walletAddress,
          title: signal.title,
          description: signal.description,
          strength: signal.strength,
          tierRequired: signal.tierRequired,
          txHash: signal.txHash,
          blockNumber: signal.blockNumber,
          metadata: signal.metadata,
        })

        const { signature, timestamp } = signPayload(body)

        await withRetry(
          () =>
            fetch(`${API_BASE}/api/internal/ingest-signal`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-worker-signature': signature,
                'x-worker-timestamp': timestamp,
              },
              body,
            }).then(async (res) => {
              if (!res.ok) {
                const err = await res.text()
                throw new Error(`API error ${res.status}: ${err}`)
              }
            }),
          { maxAttempts: 3, initialDelayMs: 500 }
        )

        logger.info(`[Broadcaster] Signal sent: ${signal.type} (strength: ${signal.strength})`)
      } catch (err) {
        logger.error(`[Broadcaster] Failed to send signal`, err)
      }
    }
  }
}
