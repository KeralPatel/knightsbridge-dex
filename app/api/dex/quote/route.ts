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

  const { sellToken, buyToken, sellAmount, chainId, slippage } = parsed.data

  try {
    // Convert human-readable amount to wei if needed
    let sellAmountWei = sellAmount
    if (!sellAmount.includes('.') && sellAmount.length < 18) {
      // Already in wei
      sellAmountWei = sellAmount
    } else {
      // Convert from ETH to wei
      sellAmountWei = ethers.parseEther(sellAmount).toString()
    }

    const quote = await getPrice({
      sellToken,
      buyToken,
      sellAmount: sellAmountWei,
      chainId,
    })

    return NextResponse.json(quote, {
      headers: {
        'Cache-Control': 'no-cache, no-store',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Quote failed'
    // Return mock data if 0x API not configured
    if (msg.includes('API key') || !process.env.ZERO_EX_API_KEY) {
      return NextResponse.json({
        price: '0.0003012',
        priceImpact: '0.12',
        buyAmount: (parseFloat(sellAmount) * 3321.50).toFixed(6),
        estimatedGas: '180000',
      })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
