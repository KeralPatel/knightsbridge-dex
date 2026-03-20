import { detectLargeTransfers } from './detectors/largeTransfer'
import { detectSmartMoneyEntry } from './detectors/smartMoneyEntry'
import { detectLiquidityRemoval } from './detectors/liquidityRemoval'
import { detectInsiderBuys } from './detectors/insiderBuy'
import { detectRugPattern } from './detectors/rugPattern'
import { SignalBroadcaster } from './broadcaster'
import { logger } from '../utils/logger'

const CHAINS = ['1', '8453']

export class SignalsEngine {
  private broadcaster = new SignalBroadcaster()

  async runDetectors(): Promise<void> {
    for (const chain of CHAINS) {
      await this.runForChain(chain)
    }
  }

  private async runForChain(chain: string): Promise<void> {
    const detectors = [
      { name: 'LargeTransfer', fn: () => detectLargeTransfers(chain) },
      { name: 'SmartMoneyEntry', fn: () => detectSmartMoneyEntry(chain) },
      { name: 'LiquidityRemoval', fn: () => detectLiquidityRemoval(chain) },
      { name: 'InsiderBuy', fn: () => detectInsiderBuys(chain) },
      { name: 'RugPattern', fn: () => detectRugPattern(chain) },
    ]

    const allSignals = []

    for (const detector of detectors) {
      try {
        const signals = await detector.fn()
        if (signals.length > 0) {
          logger.info(`[${detector.name}] Chain ${chain}: ${signals.length} signal(s)`)
          allSignals.push(...signals)
        }
      } catch (err) {
        logger.error(`[${detector.name}] Chain ${chain} failed`, err)
      }
    }

    if (allSignals.length > 0) {
      await this.broadcaster.broadcast(allSignals)
    }
  }
}
