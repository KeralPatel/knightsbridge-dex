'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { SWRConfig } from 'swr'

// ─── Ethers Context ──────────────────────────────────────────────────────────
interface EthersContextValue {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  address: string | null
  chainId: number | null
  isConnecting: boolean
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

export const EthersContext = createContext<EthersContextValue>({
  provider: null,
  signer: null,
  address: null,
  chainId: null,
  isConnecting: false,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
})

export function useEthersContext() {
  return useContext(EthersContext)
}

const SUPPORTED_CHAINS: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  11155111: 'Sepolia',
}

function EthersProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('No wallet detected. Please install MetaMask.')
      return
    }
    setIsConnecting(true)
    try {
      const prov = new ethers.BrowserProvider(window.ethereum)
      await prov.send('eth_requestAccounts', [])
      const sign = await prov.getSigner()
      const addr = await sign.getAddress()
      const network = await prov.getNetwork()
      const cid = Number(network.chainId)

      setProvider(prov)
      setSigner(sign)
      setAddress(addr)
      setChainId(cid)

      localStorage.setItem('kbdex_wallet_connected', '1')
    } catch (err) {
      console.error('Wallet connect failed:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    localStorage.removeItem('kbdex_wallet_connected')
  }, [])

  const switchChain = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return
    const hexChainId = '0x' + targetChainId.toString(16)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      })
    } catch (err: unknown) {
      const error = err as { code?: number }
      // Chain not added — add it for Base
      if (error.code === 4902 && targetChainId === 8453) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x2105',
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          }],
        })
      }
    }
  }, [])

  // Auto-reconnect on load
  useEffect(() => {
    if (localStorage.getItem('kbdex_wallet_connected') && window.ethereum) {
      connect()
    }
  }, [connect])

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      if (accounts.length === 0) disconnect()
      else setAddress(accounts[0])
    }
    const handleChainChanged = (...args: unknown[]) => {
      const chainIdHex = args[0] as string
      setChainId(parseInt(chainIdHex, 16))
    }
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnect])

  return (
    <EthersContext.Provider value={{
      provider,
      signer,
      address,
      chainId,
      isConnecting,
      isConnected: !!address,
      connect,
      disconnect,
      switchChain,
    }}>
      {children}
    </EthersContext.Provider>
  )
}

// ─── SWR Fetcher ─────────────────────────────────────────────────────────────
const fetcher = async (url: string) => {
  const token = localStorage.getItem('kbdex_token')
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }
  return res.json()
}

// ─── Root Providers ───────────────────────────────────────────────────────────
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 5000 }}>
      <EthersProvider>
        {children}
      </EthersProvider>
    </SWRConfig>
  )
}

// Extend window type for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}
