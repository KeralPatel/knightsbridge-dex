'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

interface Signal {
  id: string
  type: string
  chain: string
  token_address: string | null
  wallet_address: string | null
  title: string
  description: string | null
  strength: number
  tier_required: string
  metadata: Record<string, unknown>
  tx_hash: string | null
  block_number: number | null
  is_active: boolean
  created_at: string
}

interface UseSignalsFeedOptions {
  chain?: string
  type?: string
  minStrength?: number
  maxItems?: number
}

export function useSignalsFeed(options: UseSignalsFeedOptions = {}) {
  const { chain, type, minStrength = 0, maxItems = 50 } = options
  const [signals, setSignals] = useState<Signal[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>['channel']> | null>(null)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    params.set('limit', maxItems.toString())
    if (chain) params.set('chain', chain)
    if (type) params.set('type', type)
    if (minStrength > 0) params.set('minStrength', minStrength.toString())
    return `/api/signals?${params.toString()}`
  }, [chain, type, minStrength, maxItems])

  // Load (or reload) signals from the API route (uses service-role key server-side)
  const loadSignals = useCallback(async () => {
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSignals(data.signals ?? [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load signals'))
    }
  }, [buildUrl])

  useEffect(() => {
    // Initial fetch
    loadSignals()

    // Poll every 30s as a fallback
    const pollInterval = setInterval(loadSignals, 30_000)

    // Supabase Realtime for instant updates
    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel('signals-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signals' },
        (payload) => {
          const newSignal = payload.new as Signal
          if (!newSignal.is_active) return
          if (minStrength && newSignal.strength < minStrength) return
          if (chain && newSignal.chain !== chain) return
          if (type && newSignal.type !== type) return
          setSignals((prev) => [newSignal, ...prev].slice(0, maxItems))
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        // Don't set error on CHANNEL_ERROR — polling will keep data fresh
      })

    channelRef.current = channel

    return () => {
      clearInterval(pollInterval)
      channel.unsubscribe()
    }
  }, [chain, type, minStrength, maxItems, loadSignals])

  return { signals, isConnected, error }
}
