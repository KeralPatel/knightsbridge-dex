'use client'

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useEthers } from './useEthers'

type SwapState =
  | 'idle'
  | 'fetching_quote'
  | 'simulating'
  | 'checking_allowance'
  | 'approving'
  | 'awaiting_approval'
  | 'swapping'
  | 'awaiting_swap'
  | 'success'
  | 'error'

interface SwapParams {
  sellToken: string
  buyToken: string
  sellAmount: string
  slippageBps: number
  chainId: number
}

interface SwapResult {
  txHash: string
  sellAmount: string
  buyAmount: string
}

const ERC20_APPROVE_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

export function useSwap() {
  const { signer, address, chainId } = useEthers()
  const [state, setState] = useState<SwapState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SwapResult | null>(null)
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)

  const executeSwap = useCallback(
    async (params: SwapParams): Promise<SwapResult> => {
      if (!signer || !address) throw new Error('Wallet not connected')
      if (chainId !== params.chainId) throw new Error('Wrong network')

      setError(null)
      setResult(null)
      setApproveTxHash(null)

      try {
        // 1. Fetch swap tx from API
        setState('fetching_quote')
        const quoteRes = await fetch(
          `/api/dex/swap?sellToken=${params.sellToken}&buyToken=${params.buyToken}&sellAmount=${params.sellAmount}&taker=${address}&slippageBps=${params.slippageBps}&chainId=${params.chainId}`
        )
        if (!quoteRes.ok) {
          const err = await quoteRes.json()
          throw new Error(err.error ?? 'Quote failed')
        }
        const { txData, allowanceTarget, buyAmount } = await quoteRes.json()

        // 2. Simulate
        setState('simulating')
        const simulateRes = await fetch('/api/dex/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...txData, chainId: params.chainId }),
        })
        const simResult = await simulateRes.json()
        if (!simResult.success) {
          throw new Error(`Simulation failed: ${simResult.revertReason ?? 'unknown'}`)
        }

        // 3. Check + handle ERC20 allowance
        if (
          params.sellToken.toLowerCase() !== ETH_ADDRESS &&
          allowanceTarget &&
          allowanceTarget !== ethers.ZeroAddress
        ) {
          setState('checking_allowance')
          const tokenContract = new ethers.Contract(params.sellToken, ERC20_APPROVE_ABI, signer)
          const allowance: bigint = await tokenContract.allowance(address, allowanceTarget)
          const sellAmountBn = BigInt(params.sellAmount)

          if (allowance < sellAmountBn) {
            setState('approving')
            const approveTx = await tokenContract.approve(allowanceTarget, ethers.MaxUint256)
            setState('awaiting_approval')
            setApproveTxHash(approveTx.hash)
            await approveTx.wait()
          }
        }

        // 4. Execute swap
        setState('swapping')
        const swapTx = await signer.sendTransaction({
          to: txData.to,
          data: txData.data,
          value: txData.value ? BigInt(txData.value) : 0n,
          gasLimit: simResult.gasEstimate
            ? BigInt(Math.ceil(Number(simResult.gasEstimate) * 1.2))
            : undefined,
        })
        setState('awaiting_swap')
        const receipt = await swapTx.wait()

        const swapResult: SwapResult = {
          txHash: receipt!.hash,
          sellAmount: params.sellAmount,
          buyAmount,
        }
        setResult(swapResult)
        setState('success')
        return swapResult
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Swap failed'
        setError(message)
        setState('error')
        throw err
      }
    },
    [signer, address, chainId]
  )

  const reset = useCallback(() => {
    setState('idle')
    setError(null)
    setResult(null)
    setApproveTxHash(null)
  }, [])

  const isLoading = ![' idle', 'success', 'error'].includes(state)

  return {
    state,
    error,
    result,
    approveTxHash,
    isLoading: state !== 'idle' && state !== 'success' && state !== 'error',
    executeSwap,
    reset,
  }
}
