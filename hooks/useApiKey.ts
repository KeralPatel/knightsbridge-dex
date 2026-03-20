'use client'

import useSWR from 'swr'
import { useState } from 'react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  tier: string
  rateLimitRpm: number
  lastUsedAt: string | null
  usageCount: number
  createdAt: string
}

export function useApiKey() {
  const { data, error, isLoading, mutate } = useSWR<{ keys: ApiKey[] }>(
    '/api/user/api-keys'
  )
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)

  const createKey = async (name: string) => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kbdex_token') ?? ''}`,
        },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create key')
      setNewKeyValue(json.key) // Only shown once
      await mutate()
      return json.key as string
    } finally {
      setIsCreating(false)
    }
  }

  const deleteKey = async (id: string) => {
    setIsDeleting(id)
    try {
      const res = await fetch(`/api/user/api-keys?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kbdex_token') ?? ''}`,
        },
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to delete key')
      }
      await mutate()
    } finally {
      setIsDeleting(null)
    }
  }

  const dismissNewKey = () => setNewKeyValue(null)

  return {
    keys: data?.keys ?? [],
    isLoading,
    error,
    isCreating,
    isDeleting,
    newKeyValue,
    createKey,
    deleteKey,
    dismissNewKey,
  }
}
