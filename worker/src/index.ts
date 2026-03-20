import cron from 'node-cron'
import { BlockIndexer } from './indexer/blockIndexer'
import { SignalsEngine } from './signals/signalsEngine'
import { ClusterBuilder } from './intelligence/clusterBuilder'
import { RiskRefresher } from './intelligence/riskRefresher'
import { logger } from './utils/logger'

// Validate required env vars
const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'WORKER_HMAC_SECRET',
]

for (const env of REQUIRED_ENV) {
  if (!process.env[env]) {
    logger.error(`Missing required env var: ${env}`)
    process.exit(1)
  }
}

const CHAINS = ['1', '8453']
const blockIndexer = new BlockIndexer()
const signalsEngine = new SignalsEngine()
const clusterBuilder = new ClusterBuilder()
const riskRefresher = new RiskRefresher()

let isRunning = false

async function safeRun(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (err) {
    logger.error(`[${name}] Uncaught error`, err)
  }
}

// ─── Every 30s: index new blocks ─────────────────────────────────────────────
cron.schedule('*/30 * * * * *', async () => {
  for (const chain of CHAINS) {
    await safeRun('BlockIndexer', () => blockIndexer.processLatestBlocks(chain))
  }
})

// ─── Every 60s: run signal detectors ─────────────────────────────────────────
cron.schedule('*/60 * * * * *', async () => {
  await safeRun('SignalsEngine', () => signalsEngine.runDetectors())
})

// ─── Every 5min: refresh high-priority risk scores ───────────────────────────
cron.schedule('*/5 * * * *', async () => {
  for (const chain of CHAINS) {
    await safeRun('RiskRefresher.highPriority', () => riskRefresher.refreshHighPriorityTokens(chain))
  }
})

// ─── Every 1hr: rebuild wallet clusters ──────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  for (const chain of CHAINS) {
    await safeRun('ClusterBuilder', () => clusterBuilder.rebuildClusters(chain))
  }
})

// ─── Every 6hr: full risk sweep ───────────────────────────────────────────────
cron.schedule('0 */6 * * *', async () => {
  for (const chain of CHAINS) {
    await safeRun('RiskRefresher.fullSweep', () => riskRefresher.fullRiskSweep(chain))
  }
})

logger.info('Knightsbridge Worker started')
logger.info(`Monitoring chains: ${CHAINS.join(', ')}`)
logger.info('Schedule:')
logger.info('  Block indexer:  every 30s')
logger.info('  Signal engine:  every 60s')
logger.info('  Risk refresh:   every 5m')
logger.info('  Cluster build:  every 1h')
logger.info('  Full risk sweep: every 6h')

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully')
  process.exit(0)
})
