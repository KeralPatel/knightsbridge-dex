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

  const { sellToken, buyToken, sellAmount, chainId, slippage } = parsed.data

  try {
    let sellAmountWei = sellAmount
    if (parseFloat(sellAmount) < 1e10) {
      sellAmountWei = ethers.parseEther(sellAmount).toString()
    }

    const slippageBps = Math.floor(slippage * 100)

    const quote = await getQuote({
      sellToken,
      buyToken,
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
