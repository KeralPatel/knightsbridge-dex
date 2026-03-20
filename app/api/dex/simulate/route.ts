import { NextRequest, NextResponse } from 'next/server'
import { simulateSchema } from '@/lib/security/validate'
import { getProvider } from '@/lib/ethers/provider'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = simulateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { to, data, value, from, chainId } = parsed.data
  const provider = getProvider(chainId)

  try {
    const result = await provider.call({
      to,
      data,
      value: BigInt(value),
      from,
    })

    // Estimate gas
    const gasEstimate = await provider.estimateGas({
      to, data, value: BigInt(value), from,
    }).catch(() => BigInt(200000))

    return NextResponse.json({
      success: true,
      result,
      gasEstimate: gasEstimate.toString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Simulation failed'

    // Parse revert reason
    let revertReason = 'Transaction would fail'
    if (msg.includes('execution reverted:')) {
      revertReason = msg.split('execution reverted:')[1]?.trim() || revertReason
    } else if (msg.includes('revert')) {
      revertReason = 'Transaction reverted'
    }

    return NextResponse.json({
      success: false,
      revertReason,
      gasEstimate: null,
    })
  }
}
