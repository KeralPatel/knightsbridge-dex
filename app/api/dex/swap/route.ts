import { NextRequest, NextResponse } from 'next/server'
import { dexQuoteSchema, addressSchema } from '@/lib/security/validate'
import { getQuote } from '@/lib/0x/quote'
import { ethers } from 'ethers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const takerRaw = searchParams.get('takerAddress')

  const parsed = dexQuoteSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const takerParsed = addressSchema.safeParse(takerRaw)
  if (!takerParsed.success) {
    return NextResponse.json({ error: 'Invalid taker address' }, { status: 400 })
  }

  const { sellToken, buyToken, sellAmount, chainId, slippage, decimals } = parsed.data

  const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  const normSell = sellToken.toUpperCase() === 'ETH' ? ETH_ADDRESS : sellToken
  const normBuy  = buyToken.toUpperCase()  === 'ETH' ? ETH_ADDRESS : buyToken

  try {
    const sellAmountWei = ethers.parseUnits(sellAmount, decimals).toString()
    const slippageBps = Math.floor(slippage * 100)

    const quote = await getQuote({
      sellToken: normSell,
      buyToken: normBuy,
      sellAmount: sellAmountWei,
      takerAddress: takerParsed.data,
      slippageBps,
      chainId,
    })

    return NextResponse.json({
      txData: {
        to: quote.to,
        data: quote.data,
        value: quote.value,
      },
      allowanceTarget: quote.allowanceTarget,
      buyAmount: quote.buyAmount,
      price: quote.price,
      priceImpact: quote.priceImpact,
      route: quote.route,
      estimatedGas: quote.estimatedGas,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Swap failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
