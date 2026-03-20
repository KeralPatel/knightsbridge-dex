// Union-Find based wallet clustering

export interface WalletEdge {
  walletA: string
  walletB: string
  reason: 'same_funder' | 'timing_correlation' | 'common_tokens' | 'gas_price_match' | 'round_trip'
}

export interface WalletCluster {
  id: number
  members: string[]
  behaviorTags: string[]
}

class UnionFind {
  private parent = new Map<string, string>()
  private rank = new Map<string, number>()

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x)
      this.rank.set(x, 0)
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!))
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

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>()
    for (const [wallet] of this.parent) {
      const root = this.find(wallet)
      if (!groups.has(root)) groups.set(root, [])
      groups.get(root)!.push(wallet)
    }
    return groups
  }
}

export function buildClusters(
  edges: WalletEdge[],
  minSize: number = 2
): WalletCluster[] {
  const uf = new UnionFind()

  for (const edge of edges) {
    uf.union(edge.walletA.toLowerCase(), edge.walletB.toLowerCase())
  }

  const groups = uf.getGroups()
  const clusters: WalletCluster[] = []
  let clusterId = 1

  // Build reason map for tagging
  const walletReasons = new Map<string, Set<string>>()
  for (const edge of edges) {
    const aLow = edge.walletA.toLowerCase()
    const bLow = edge.walletB.toLowerCase()
    if (!walletReasons.has(aLow)) walletReasons.set(aLow, new Set())
    if (!walletReasons.has(bLow)) walletReasons.set(bLow, new Set())
    walletReasons.get(aLow)!.add(edge.reason)
    walletReasons.get(bLow)!.add(edge.reason)
  }

  for (const [, members] of groups) {
    if (members.length < minSize) continue

    // Determine behavior tags from reasons
    const allReasons = new Set<string>()
    members.forEach((m) => {
      walletReasons.get(m)?.forEach((r) => allReasons.add(r))
    })

    const behaviorTags: string[] = []
    if (allReasons.has('same_funder')) behaviorTags.push('coordinated')
    if (allReasons.has('timing_correlation')) behaviorTags.push('synchronized')
    if (allReasons.has('round_trip')) behaviorTags.push('wash_trading')
    if (allReasons.has('gas_price_match')) behaviorTags.push('bot')
    if (members.length > 10) behaviorTags.push('whale_cluster')

    clusters.push({
      id: clusterId++,
      members,
      behaviorTags,
    })
  }

  return clusters.sort((a, b) => b.members.length - a.members.length)
}

// Heuristic link detection from transaction data
export function detectEdgesFromTransactions(
  txs: Array<{
    fromAddress: string
    toAddress?: string | null
    blockTime: string | Date
    value?: bigint
    gasPrice?: bigint
  }>
): WalletEdge[] {
  const edges: WalletEdge[] = []
  const sorted = [...txs].sort(
    (a, b) => new Date(a.blockTime).getTime() - new Date(b.blockTime).getTime()
  )

  // 1. Round-trip detection: A→B followed by B→A within 48h
  const transfers = sorted.filter((t) => t.toAddress)
  const roundTripWindow = 48 * 60 * 60 * 1000

  for (let i = 0; i < transfers.length; i++) {
    for (let j = i + 1; j < transfers.length; j++) {
      const ti = transfers[i]
      const tj = transfers[j]
      const timeDiff = new Date(tj.blockTime).getTime() - new Date(ti.blockTime).getTime()
      if (timeDiff > roundTripWindow) break

      if (
        ti.fromAddress === tj.toAddress &&
        ti.toAddress === tj.fromAddress
      ) {
        edges.push({
          walletA: ti.fromAddress,
          walletB: ti.toAddress!,
          reason: 'round_trip',
        })
      }
    }
  }

  // 2. Gas price matching in same block
  const blockGroups = new Map<string, typeof transfers>()
  for (const tx of transfers) {
    const key = `${tx.blockTime}-${tx.gasPrice?.toString()}`
    if (!blockGroups.has(key)) blockGroups.set(key, [])
    blockGroups.get(key)!.push(tx)
  }

  for (const [, group] of blockGroups) {
    if (group.length >= 2) {
      for (let i = 0; i < group.length - 1; i++) {
        edges.push({
          walletA: group[i].fromAddress,
          walletB: group[i + 1].fromAddress,
          reason: 'gas_price_match',
        })
      }
    }
  }

  return edges
}
