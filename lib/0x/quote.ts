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
  sellAmount: string
  chainId: number
}): Promise<{ price: string; priceImpact: string; buyAmount: string }> {
  const data = await fetch0x('/swap/permit2/price', params.chainId, {
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
  })
  return {
    price: data.price || '0',
    priceImpact: (parseFloat(data.estimatedPriceImpact || '0') * 100).toFixed(4),
    buyAmount: data.buyAmount || '0',
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
  const data = await fetch0x('/swap/permit2/quote', params.chainId, {
    sellToken: params.sellToken,
    buyToken: params.buyToken,
    sellAmount: params.sellAmount,
    taker: params.takerAddress,
    slippageBps: params.slippageBps.toString(),
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
