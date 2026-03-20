import { ethers } from 'ethers'
import { getProvider } from '@/lib/ethers/provider'
import { getUniswapV2Factory, getUniswapV2Pair, getERC20, CONTRACT_ADDRESSES } from '@/lib/ethers/contracts'

export interface LiquidityHealthResult {
  liquidityUsd: number
  marketCapUsd: number
  lpToMcapRatio: number
  hasLiquidity: boolean
  hasFakeLiquidity: boolean
  deployerHoldsLpPercent: number
  poolAddress: string | null
  reserve0: string
  reserve1: string
  token0: string
  token1: string
}

export async function getLiquidityHealth(
  tokenAddress: string,
  chainId: number = 1,
  ethPriceUsd: number = 3000
): Promise<LiquidityHealthResult> {
  const provider = getProvider(chainId)
  const factory = getUniswapV2Factory(chainId)
  const weth = CONTRACT_ADDRESSES[chainId as 1 | 8453]?.weth

  const defaults: LiquidityHealthResult = {
    liquidityUsd: 0,
    marketCapUsd: 0,
    lpToMcapRatio: 0,
    hasLiquidity: false,
    hasFakeLiquidity: false,
    deployerHoldsLpPercent: 0,
    poolAddress: null,
    reserve0: '0',
    reserve1: '0',
    token0: '',
    token1: '',
  }

  try {
    // Get pair address
    const pairAddr: string = await factory.getPair(tokenAddress, weth)
    if (!pairAddr || pairAddr === ethers.ZeroAddress) return defaults

    const pair = getUniswapV2Pair(pairAddr, chainId)
    const [reserves, token0Addr] = await Promise.all([
      pair.getReserves(),
      pair.token0(),
    ])

    const isToken0 = token0Addr.toLowerCase() === tokenAddress.toLowerCase()
    const ethReserve = isToken0 ? reserves[1] : reserves[0]
    const tokenReserve = isToken0 ? reserves[0] : reserves[1]

    const ethInPool = parseFloat(ethers.formatEther(ethReserve))
    const liquidityUsd = ethInPool * ethPriceUsd * 2  // both sides of LP

    // Estimate market cap from price
    const token = getERC20(tokenAddress, chainId)
    const totalSupply: bigint = await token.totalSupply()
    const decimals: number = await token.decimals()
    const supplyFormatted = parseFloat(ethers.formatUnits(totalSupply, decimals))

    const tokenPriceEth = ethInPool / parseFloat(ethers.formatUnits(tokenReserve, decimals))
    const tokenPriceUsd = tokenPriceEth * ethPriceUsd
    const marketCapUsd = supplyFormatted * tokenPriceUsd

    const lpToMcapRatio = marketCapUsd > 0 ? liquidityUsd / marketCapUsd : 0
    const hasFakeLiquidity = lpToMcapRatio < 0.01 && marketCapUsd > 10_000

    // Check if deployer holds most LP tokens
    const lpTotal: bigint = await pair.totalSupply()
    // We'd need the deployer address to check this — return 0 if not available
    const deployerHoldsLpPercent = 0

    return {
      liquidityUsd,
      marketCapUsd,
      lpToMcapRatio,
      hasLiquidity: liquidityUsd > 100,
      hasFakeLiquidity,
      deployerHoldsLpPercent,
      poolAddress: pairAddr,
      reserve0: ethers.formatEther(reserves[0]),
      reserve1: ethers.formatEther(reserves[1]),
      token0: token0Addr,
      token1: isToken0 ? weth : tokenAddress,
    }
  } catch {
    return defaults
  }
}
