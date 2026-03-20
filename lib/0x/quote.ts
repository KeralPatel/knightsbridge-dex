import { fetch0x } from './client'

export interface QuoteResult {
  buyAmount: string
  sellAmount: string
  price: string
  guaranteedPrice: string
  priceImpact: string
  route: RouteStep[]
  estimatedGas: string
  allowanceTarget: string
  to: string
  data: string
  value: string
  gasPrice: string
}

export interface RouteStep {
  type: string
  name: string
  proportion: string
  fillData?: unknown
}

export async function getPrice(params: {
  sellToken: string
  buyToken: string
  sellAmount: string       // in smallest units (wei)
  chainId: number
  sellDecimals?: number
  buyDecimals?: number
}): Promise<{ price: string; priceImpact: string; buyAmount: string; estimatedGas: string }> {
  const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT
  const feeBps       = process.env.NEXT_PUBLIC_INTEGRATOR_FEE_BPS || '15'  // 0.15% default

  const data = await fetch0x('/swap/permit2/price', params.chainId, {
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    ...(feeRecipient && {
      integratorFeeRecipient: feeRecipient,
      integratorFeeBps: feeBps,
    }),
  })

  // 0x price endpoint returns gas (not estimatedGas) and no price field.
  // Compute human-readable price from raw amounts + decimals.
  const sellDec = params.sellDecimals ?? 18
  const buyDec  = params.buyDecimals  ?? 18
  const buyHuman  = parseFloat(data.buyAmount  || '0') / Math.pow(10, buyDec)
  const sellHuman = parseFloat(params.sellAmount)      / Math.pow(10, sellDec)
  const price = sellHuman > 0 ? (buyHuman / sellHuman).toFixed(6) : '0'

  return {
    price,
    priceImpact: (parseFloat(data.estimatedPriceImpact || '0') * 100).toFixed(4),
    buyAmount: data.buyAmount || '0',
    estimatedGas: data.gas || data.estimatedGas || '200000',
  }
}

export async function getQuote(params: {
  sellToken: string
  buyToken: string
  sellAmount: string
  takerAddress: string
  slippageBps: number
  chainId: number
}): Promise<QuoteResult> {
  const feeRecipient = process.env.NEXT_PUBLIC_FEE_RECIPIENT
  const feeBps       = process.env.NEXT_PUBLIC_INTEGRATOR_FEE_BPS || '15'

  const data = await fetch0x('/swap/permit2/quote', params.chainId, {
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    taker: params.takerAddress,
    slippageBps: params.slippageBps.toString(),
    ...(feeRecipient && {
      integratorFeeRecipient: feeRecipient,
      integratorFeeBps: feeBps,
    }),
  })

  const routes: RouteStep[] = (data.route?.fills || []).map((fill: {
    source?: string
    proportion?: string
    type?: string
  }) => ({
    type: fill.type || 'uniswap',
    name: fill.source || 'Unknown',
    proportion: fill.proportion || '1',
  }))

  return {
    buyAmount: data.buyAmount,
    sellAmount: data.sellAmount,
    price: data.price,
    guaranteedPrice: data.guaranteedPrice,
    priceImpact: (parseFloat(data.estimatedPriceImpact || '0') * 100).toFixed(4),
    route: routes,
    estimatedGas: data.estimatedGas || '200000',
    allowanceTarget: data.issues?.allowance?.spender || '',
    to: data.transaction?.to || '',
    data: data.transaction?.data || '',
    value: data.transaction?.value || '0',
    gasPrice: data.transaction?.gasPrice || '0',
  }
}
