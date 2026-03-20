'use client'

import { useContext } from 'react'
import { EthersContext } from '@/app/providers'

export function useEthers() {
  return useContext(EthersContext)
}
