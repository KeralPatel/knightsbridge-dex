import { NextRequest, NextResponse } from 'next/server'
import { addressSchema } from '@/lib/security/validate'

// Pro tier required — checked in route handler
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: rawAddr } = await params
  const parsed = addressSchema.safeParse(rawAddr)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid address' }, { status: 400 })

  const userTier = req.headers.get('x-user-tier') || 'free'
  if (userTier === 'free') {
    return NextResponse.json({ error: 'Pro tier required', requiredTier: 'pro' }, { status: 403 })
  }

  // In production: fetch from Alchemy/QuickNode token holder API or Etherscan
  // Mock response for now
  const mockHolders = Array.from({ length: 20 }, (_, i) => ({
    address: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`,
    balance: Math.floor(Math.random() * 1_000_000_000),
    percent: Math.random() * (i === 0 ? 30 : i < 5 ? 15 : 5),
    isSmartMoney: Math.random() > 0.85,
    isDevWallet: i === 0,
    label: i === 0 ? 'Deployer' : null,
  }))

  const distribution = {
    top10Percent: mockHolders.slice(0, 10).reduce((a, h) => a + h.percent, 0),
    top50Percent: mockHolders.reduce((a, h) => a + h.percent, 0),
    uniqueHolders: 1247,
  }

  return NextResponse.json({ holders: mockHolders, distribution })
}
