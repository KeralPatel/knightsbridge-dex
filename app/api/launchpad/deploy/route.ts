import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { TOKEN_FACTORY_ABI, CONTRACT_ADDRESSES } from '@/lib/ethers/contracts'
import { getProvider } from '@/lib/ethers/provider'
import { createListingSchema } from '@/lib/security/validate'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const body = await req.json()

  const parsed = createListingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, symbol, totalSupply, lockDurationDays, liquidityEth, chainId, creatorWallet } = parsed.data

  const factoryAddr = CONTRACT_ADDRESSES[chainId as 1 | 8453]?.tokenFactory
  if (!factoryAddr || factoryAddr === '') {
    return NextResponse.json({ error: 'TokenFactory not deployed on this network' }, { status: 400 })
  }

  const provider = getProvider(chainId)
  const factory = new ethers.Contract(factoryAddr, TOKEN_FACTORY_ABI, provider)

  // Get deploy fee from contract
  let deployFee: bigint
  try {
    deployFee = await factory.deployFee()
  } catch {
    deployFee = ethers.parseEther('0.001')
  }

  const liquidityWei = ethers.parseEther(liquidityEth || '0.01')
  const supplyWei = ethers.parseUnits(totalSupply, 18)
  const totalValue = deployFee + liquidityWei

  // Encode the transaction data
  const iface = new ethers.Interface(TOKEN_FACTORY_ABI)
  const callData = iface.encodeFunctionData('deployToken', [
    name,
    symbol,
    supplyWei,
    lockDurationDays,
    liquidityWei,
  ])

  // Estimate gas
  let gasEstimate = '300000'
  try {
    const estimate = await provider.estimateGas({
      to: factoryAddr,
      data: callData,
      value: totalValue,
      from: creatorWallet,
    })
    gasEstimate = Math.ceil(Number(estimate) * 1.2).toString()  // 20% buffer
  } catch { /* Use default */ }

  return NextResponse.json({
    txData: {
      to: factoryAddr,
      data: callData,
      value: totalValue.toString(),
    },
    estimatedGas: gasEstimate,
    deployFee: deployFee.toString(),
    liquidityWei: liquidityWei.toString(),
  })
}
