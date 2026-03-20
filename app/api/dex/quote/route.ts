import { NextRequest, NextResponse } from 'next/server'
import { dexQuoteSchema } from '@/lib/security/validate'
import { getPrice } from '@/lib/0x/quote'
import { ethers } from 'ethers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = dexQuoteSchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { sellToken, buyToken, sellAmount, chainId, decimals, buyDecimals } = parsed.data

  // Map native ETH symbol to the standard address 0x uses
  const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  const normSell = sellToken.toUpperCase() === 'ETH' ? ETH_ADDRESS : sellToken
  const normBuy  = buyToken.toUpperCase()  === 'ETH' ? ETH_ADDRESS : buyToken

  try {
    // Always convert from human-readable to smallest unit (wei for ETH, etc.)
    const sellAmountWei = ethers.parseUnits(sellAmount, decimals).toString()

    const quote = await getPrice({
      sellToken: normSell,
      buyToken: normBuy,
      sellAmount: sellAmountWei,
      chainId,
      sellDecimals: decimals,
      buyDecimals,
    })

    return NextResponse.json(quote, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quote failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
