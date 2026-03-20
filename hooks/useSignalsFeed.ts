'use client'

import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    // Load initial signals
    const loadInitial = async () => {
      let query = supabase
        .from('signals')
        .select('*')
        .eq('is_active', true)
        .gte('strength', minStrength)
        .order('created_at', { ascending: false })
        .limit(maxItems)

      if (chain) query = query.eq('chain', chain)
      if (type) query = query.eq('type', type)

      const { data, error: fetchError } = await query
      if (fetchError) {
        setError(new Error(fetchError.message))
      } else {
        setSignals(data ?? [])
      }
    }

    loadInitial()

    // Subscribe to realtime inserts
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
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Realtime connection failed'))
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [chain, type, minStrength, maxItems])

  return { signals, isConnected, error }
}
