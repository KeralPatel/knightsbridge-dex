import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIN_CLUSTER_SIZE = 2
const ROUND_TRIP_HOURS = 48
const COMMON_TOKENS_THRESHOLD = 5
const TIMING_WINDOW_MINUTES = 5

interface WalletEdge {
  from: string
  to: string
  reason: string
}

class UnionFind {
  private parent: Map<string, string> = new Map()
  private rank: Map<string, number> = new Map()

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      this.rank.set(x, 0)
    }
    const parent = this.parent.get(x)!
    if (parent !== x) {
      this.parent.set(x, this.find(parent))
    }
    return this.parent.get(x)!
  }

  union(x: string, y: string): void {
    const px = this.find(x)
    const py = this.find(y)
    if (px === py) return

    const rx = this.rank.get(px) ?? 0
    const ry = this.rank.get(py) ?? 0

    if (rx < ry) {
      this.parent.set(px, py)
    } else if (rx > ry) {
      this.parent.set(py, px)
    } else {
      this.parent.set(py, px)
      this.rank.set(px, rx + 1)
    }
  }

  groups(): Map<string, string[]> {
    const groups = new Map<string, string[]>()
    for (const [node] of this.parent) {
      const root = this.find(node)
      const group = groups.get(root) ?? []
      group.push(node)
      groups.set(root, group)
    }
    return groups
  }
}

export class ClusterBuilder {
  async rebuildClusters(chain: string): Promise<void> {
    logger.info(`[ClusterBuilder] Rebuilding clusters for chain ${chain}`)

    const edges = await this.detectEdges(chain)
    if (edges.length === 0) {
      logger.info(`[ClusterBuilder] No edges detected for chain ${chain}`)
      return
    }

    const uf = new UnionFind()
    const edgeReasons = new Map<string, Set<string>>()

    for (const edge of edges) {
      uf.union(edge.from, edge.to)
      const key = [edge.from, edge.to].sort().join(':')
      const reasons = edgeReasons.get(key) ?? new Set()
      reasons.add(edge.reason)
      edgeReasons.set(key, reasons)
    }

    const groups = uf.groups()
    let clustersCreated = 0

    for (const [, wallets] of groups) {
      if (wallets.length < MIN_CLUSTER_SIZE) continue

      // Determine behavior tags
      const tags = new Set<string>()
      for (const wallet of wallets) {
        for (const other of wallets) {
          if (wallet === other) continue
          const key = [wallet, other].sort().join(':')
          const reasons = edgeReasons.get(key)
          if (reasons) reasons.forEach((r) => tags.add(r))
        }
      }

      const behaviorTags = Array.from(tags)
      const riskLevel = tags.has('round_trip') || tags.has('coordinated')
        ? 'high'
        : tags.has('timing_correlation')
        ? 'medium'
        : 'low'

      // Upsert cluster
      const { data: cluster } = await supabase
        .from('wallet_clusters')
        .insert({
          chain,
          wallet_count: wallets.length,
          behavior_tags: behaviorTags,
          risk_level: riskLevel,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (cluster) {
        // Update wallet cluster IDs
        await supabase
          .from('wallets')
          .update({ cluster_id: cluster.id, updated_at: new Date().toISOString() })
          .in('address', wallets)
          .eq('chain', chain)

        clustersCreated++
      }
    }

    logger.info(`[ClusterBuilder] Created ${clustersCreated} clusters for chain ${chain}`)
  }

  private async detectEdges(chain: string): Promise<WalletEdge[]> {
    const edges: WalletEdge[] = []
    const since = new Date(Date.now() - ROUND_TRIP_HOURS * 60 * 60 * 1000).toISOString()

    const { data: txs } = await supabase
      .from('transactions')
      .select('hash, from_address, to_address, block_time, token_address')
      .eq('chain', chain)
      .gte('block_time', since)
      .not('from_address', 'is', null)
      .not('to_address', 'is', null)
      .limit(5000)

    if (!txs || txs.length === 0) return edges

    // Round-trip detection: A→B + B→A within 48h
    const txByFromTo = new Map<string, number>()
    for (const tx of txs) {
      if (!tx.from_address || !tx.to_address) continue
      const key = `${tx.from_address}:${tx.to_address}`
      txByFromTo.set(key, (txByFromTo.get(key) ?? 0) + 1)
    }

    for (const [key, count] of txByFromTo) {
      const [from, to] = key.split(':')
      const reverseKey = `${to}:${from}`
      if (txByFromTo.has(reverseKey) && from && to) {
        edges.push({ from, to, reason: 'round_trip' })
      }
    }

    // Timing correlation: both wallets active in same 5-min windows ≥3 times
    const windowMs = TIMING_WINDOW_MINUTES * 60 * 1000
    const windowToWallets = new Map<number, Set<string>>()

    for (const tx of txs) {
      if (!tx.from_address) continue
      const window = Math.floor(new Date(tx.block_time).getTime() / windowMs)
      const wallets = windowToWallets.get(window) ?? new Set()
      wallets.add(tx.from_address)
      windowToWallets.set(window, wallets)
    }

    const pairWindows = new Map<string, number>()
    for (const [, wallets] of windowToWallets) {
      const arr = Array.from(wallets)
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const key = [arr[i], arr[j]].sort().join(':')
          pairWindows.set(key, (pairWindows.get(key) ?? 0) + 1)
        }
      }
    }

    for (const [key, count] of pairWindows) {
      if (count >= 3) {
        const [a, b] = key.split(':')
        if (a && b) edges.push({ from: a, to: b, reason: 'timing_correlation' })
      }
    }

    return edges
  }
}
