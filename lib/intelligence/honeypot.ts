import { ethers } from 'ethers'
import { getProvider } from '@/lib/ethers/provider'
import { CONTRACT_ADDRESSES } from '@/lib/ethers/contracts'

// Uniswap V2 Router ABI (minimal)
const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[])',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[])',
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[])',
]

const ROUTER_ADDRESSES: Record<number, string> = {
  1:    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  8453: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
}

const WETH_ADDRESSES: Record<number, string> = {
  1:    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  8453: '0x4200000000000000000000000000000000000006',
}

// Dummy address for simulation
const DUMMY_ADDR = '0x0000000000000000000000000000000000000001'

export interface HoneypotResult {
  isHoneypot: boolean
  canBuy: boolean
  canSell: boolean
  buyTax: number    // 0–100 percent
  sellTax: number   // 0–100 percent
  reason?: string
}

export async function checkHoneypot(
  tokenAddress: string,
  chainId: number = 1
): Promise<HoneypotResult> {
  const provider = getProvider(chainId)
  const routerAddr = ROUTER_ADDRESSES[chainId]
  const weth = WETH_ADDRESSES[chainId]

  if (!routerAddr || !weth) {
    return { isHoneypot: false, canBuy: true, canSell: true, buyTax: 0, sellTax: 0 }
  }

  const router = new ethers.Contract(routerAddr, ROUTER_ABI, provider)
  const path = [weth, tokenAddress]
  const reversePath = [tokenAddress, weth]
  const testEthAmount = ethers.parseEther('0.1')

  try {
    // Step 1: Simulate buy
    let tokenOut: bigint
    try {
      const amountsOut: bigint[] = await router.getAmountsOut(testEthAmount, path)
      tokenOut = amountsOut[amountsOut.length - 1]
    } catch {
      return {
        isHoneypot: true,
        canBuy: false,
        canSell: false,
        buyTax: 100,
        sellTax: 100,
        reason: 'Cannot calculate buy amount — likely no liquidity or honeypot',
      }
    }

    // Step 2: Simulate sell (eth_call)
    try {
      const iface = new ethers.Interface(ROUTER_ABI)
      const callData = iface.encodeFunctionData('swapExactTokensForETH', [
        tokenOut,
        0n,  // amountOutMin = 0 for simulation
        reversePath,
        DUMMY_ADDR,
        Math.floor(Date.now() / 1000) + 3600,
      ])

      await provider.call({
        to: routerAddr,
        data: callData,
        from: DUMMY_ADDR,
      })

      // Calculate effective sell tax
      const amountsOut: bigint[] = await router.getAmountsOut(tokenOut, reversePath)
      const ethBack = amountsOut[amountsOut.length - 1]
      const sellTaxPct = Number((testEthAmount - ethBack) * 10000n / testEthAmount) / 100

      return {
        isHoneypot: sellTaxPct >= 99,
        canBuy: true,
        canSell: sellTaxPct < 99,
        buyTax: 0,
        sellTax: Math.min(100, sellTaxPct),
        reason: sellTaxPct >= 99 ? 'Sell transaction reverts' : undefined,
      }
    } catch (sellErr: unknown) {
      const msg = sellErr instanceof Error ? sellErr.message : String(sellErr)
      return {
        isHoneypot: true,
        canBuy: true,
        canSell: false,
        buyTax: 0,
        sellTax: 100,
        reason: `Sell simulation failed: ${msg.slice(0, 100)}`,
      }
    }
  } catch {
    return { isHoneypot: false, canBuy: true, canSell: true, buyTax: 0, sellTax: 0 }
  }
}
