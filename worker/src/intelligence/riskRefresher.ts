import * as crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import { withRetry } from '../utils/retry'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

async function postRiskUpdate(payload: object): Promise<void> {
  const body = JSON.stringify(payload)
  const { signature, timestamp } = signPayload(body)

  await withRetry(
    () =>
      fetch(`${API_BASE}/api/internal/update-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worker-signature': signature,
          'x-worker-timestamp': timestamp,
        },
        body,
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Risk update failed: ${res.status}`)
      }),
    { maxAttempts: 2 }
  )
}

export class RiskRefresher {
  /**
   * Refresh risk scores for high-priority tokens (active ones, newly deployed, etc.)
   */
  async refreshHighPriorityTokens(chain: string): Promise<void> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const { data: tokens } = await supabase
      .from('tokens')
      .select('address, chain, risk_score, is_honeypot, has_fake_lp, is_verified, deployer')
      .eq('chain', chain)
      .gte('updated_at', since)
      .order('volume_24h_usd', { ascending: false, nullsFirst: false })
      .limit(50)

    if (!tokens || tokens.length === 0) return

    logger.info(`[RiskRefresher] Refreshing ${tokens.length} high-priority tokens on chain ${chain}`)

    for (const token of tokens) {
      try {
        const score = await this.computeTokenRiskScore(token)
        await postRiskUpdate({
          entityType: 'token',
          entityAddress: token.address,
          chain,
          score,
          factors: { source: 'worker_refresh', honeypot: token.is_honeypot, verified: token.is_verified },
        })
      } catch (err) {
        logger.error(`[RiskRefresher] Failed for ${token.address}`, err)
      }
    }
  }

  /**
   * Full sweep of all tokens
   */
  async fullRiskSweep(chain: string): Promise<void> {
    logger.info(`[RiskRefresher] Starting full risk sweep for chain ${chain}`)

    const PAGE_SIZE = 100
    let offset = 0
    let processed = 0

    while (true) {
      const { data: tokens } = await supabase
        .from('tokens')
        .select('address, chain, is_honeypot, has_fake_lp, is_verified, deployer')
        .eq('chain', chain)
        .range(offset, offset + PAGE_SIZE - 1)

      if (!tokens || tokens.length === 0) break

      for (const token of tokens) {
        try {
          const score = await this.computeTokenRiskScore(token)
          await postRiskUpdate({
            entityType: 'token',
            entityAddress: token.address,
            chain,
            score,
            factors: { source: 'full_sweep' },
          })
          processed++
        } catch {
          // Continue on error
        }
      }

      offset += PAGE_SIZE
      if (tokens.length < PAGE_SIZE) break
    }

    logger.info(`[RiskRefresher] Full sweep complete: ${processed} tokens on chain ${chain}`)
  }

  private async computeTokenRiskScore(token: {
    is_honeypot?: boolean | null
    has_fake_lp?: boolean | null
    is_verified?: boolean
    deployer?: string | null
  }): Promise<number> {
    let score = 0

    if (token.is_honeypot) score += 20
    if (token.has_fake_lp) score += 10
    if (!token.is_verified) score += 5

    // Dev wallet history check
    if (token.deployer) {
      const { data: devWallet } = await supabase
        .from('wallets')
        .select('is_dev_wallet, risk_score')
        .eq('address', token.deployer)
        .single()

      if (devWallet?.is_dev_wallet) score += 15
      if (devWallet?.risk_score && devWallet.risk_score > 75) score += 20
    }

    return Math.min(100, score)
  }
}
