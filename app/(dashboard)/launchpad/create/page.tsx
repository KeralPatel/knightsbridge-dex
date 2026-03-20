'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEthersContext } from '@/app/providers'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RiskBadge } from '@/components/launchpad/RiskBadge'
import { ethers } from 'ethers'

const STEPS = ['Token Info', 'Tokenomics', 'Liquidity', 'Review & Deploy']

interface FormData {
  name: string
  symbol: string
  description: string
  website: string
  twitter: string
  telegram: string
  totalSupply: string
  lockDurationDays: number
  liquidityEth: string
  chainId: number
}

const INITIAL_FORM: FormData = {
  name: '',
  symbol: '',
  description: '',
  website: '',
  twitter: '',
  telegram: '',
  totalSupply: '1000000000',
  lockDurationDays: 365,
  liquidityEth: '1',
  chainId: 1,
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
            ${i === current ? 'bg-[#00FFA3] text-[#0B0F14]' : i < current ? 'bg-[rgba(0,255,163,0.2)] text-[#00FFA3]' : 'bg-[#1F2A37] text-[#9CA3AF]'}`}>
            {i < current ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === current ? 'text-[#E5E7EB] font-medium' : 'text-[#9CA3AF]'}`}>
            {STEPS[i]}
          </span>
          {i < total - 1 && <div className="w-8 h-px bg-[#1F2A37]" />}
        </div>
      ))}
    </div>
  )
}

export default function CreateTokenPage() {
  const router = useRouter()
  const { address, isConnected, connect, signer, chainId } = useEthersContext()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [deploying, setDeploying] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState('')

  const update = (field: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Quick risk estimate based on form values
  const estimatedRisk = Math.max(5,
    (!form.liquidityEth || parseFloat(form.liquidityEth) < 0.5 ? 20 : 0) +
    (form.lockDurationDays < 180 ? 15 : form.lockDurationDays < 365 ? 8 : 0) +
    (!form.website ? 5 : 0) +
    (!form.twitter && !form.telegram ? 5 : 0)
  )

  const handleDeploy = async () => {
    if (!isConnected || !signer) { connect(); return }
    setError('')
    setDeploying(true)

    try {
      // Get tx data from API
      const token = localStorage.getItem('kbdex_token')
      const res = await fetch('/api/launchpad/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, creatorWallet: address, chainId: chainId || 1 }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Deploy failed')
      }

      const { txData } = await res.json()

      // Send transaction
      const tx = await signer.sendTransaction({
        to: txData.to,
        data: txData.data,
        value: BigInt(txData.value),
      })

      setTxHash(tx.hash)
      await tx.wait()
      router.push('/launchpad')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg.includes('user rejected') ? 'Transaction cancelled' : msg)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#E5E7EB]">Launch Your Token</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">
          Deploy an ERC20 token with locked liquidity on Knightsbridge
        </p>
      </div>

      <StepIndicator current={step} total={STEPS.length} />

      <div className="mt-6 bg-[#11161D] border border-[#1F2A37] rounded-lg p-5">
        {/* Step 0: Token Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#E5E7EB]">Token Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Token Name *"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. MoonCat Token"
              />
              <Input
                label="Symbol *"
                value={form.symbol}
                onChange={(e) => update('symbol', e.target.value.toUpperCase().slice(0, 10))}
                placeholder="e.g. MCAT"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe your token and its use case..."
                rows={3}
                className="mt-1.5 w-full bg-[#0B0F14] border border-[#1F2A37] rounded px-3 py-2 text-sm text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:border-[#00FFA3] focus:outline-none resize-none"
              />
            </div>
            <Input label="Website" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Twitter / X" value={form.twitter} onChange={(e) => update('twitter', e.target.value)} placeholder="@handle" />
              <Input label="Telegram" value={form.telegram} onChange={(e) => update('telegram', e.target.value)} placeholder="t.me/..." />
            </div>
          </div>
        )}

        {/* Step 1: Tokenomics */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#E5E7EB]">Tokenomics</h2>
            <Input
              label="Total Supply *"
              type="number"
              value={form.totalSupply}
              onChange={(e) => update('totalSupply', e.target.value)}
              hint="The total number of tokens to mint (18 decimals)"
              suffix={form.symbol || 'TOKEN'}
            />
            <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-lg p-3">
              <p className="text-xs text-[#9CA3AF] font-medium mb-2">Distribution</p>
              <div className="space-y-2">
                {[
                  { label: 'Creator (100%)', value: '100%', color: '#00FFA3' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="h-2 rounded-full" style={{ width: item.value, backgroundColor: item.color, minWidth: '8px' }} />
                    <span className="text-xs text-[#9CA3AF]">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#9CA3AF] mt-2">100% minted to creator wallet. No team/dev allocation lock required.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Target Chain</label>
              <div className="flex gap-2 mt-1.5">
                {[{ id: 1, name: 'Ethereum', color: '#627EEA' }, { id: 8453, name: 'Base', color: '#0052FF' }].map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => update('chainId', chain.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-colors
                      ${form.chainId === chain.id ? 'border-[#00FFA3] text-[#00FFA3] bg-[rgba(0,255,163,0.05)]' : 'border-[#1F2A37] text-[#9CA3AF] hover:border-[#2d3f52]'}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chain.color }} />
                    {chain.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Liquidity */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#E5E7EB]">Liquidity Settings</h2>
            <Input
              label="Initial Liquidity (ETH) *"
              type="number"
              value={form.liquidityEth}
              onChange={(e) => update('liquidityEth', e.target.value)}
              hint="Minimum 0.01 ETH. More liquidity = lower risk score."
              suffix="ETH"
            />
            <div>
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Lock Duration</label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {[
                  { days: 30, label: '30d' },
                  { days: 90, label: '90d' },
                  { days: 365, label: '1yr' },
                  { days: 730, label: '2yr' },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => update('lockDurationDays', opt.days)}
                    className={`py-2 rounded border text-sm font-medium transition-colors
                      ${form.lockDurationDays === opt.days ? 'border-[#00FFA3] text-[#00FFA3] bg-[rgba(0,255,163,0.05)]' : 'border-[#1F2A37] text-[#9CA3AF] hover:border-[#2d3f52]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee breakdown */}
            <div className="bg-[#0B0F14] border border-[#1F2A37] rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Platform Fee</span>
                <span className="text-[#E5E7EB] tabular-nums">0.001 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Liquidity (locked)</span>
                <span className="text-[#E5E7EB] tabular-nums">{form.liquidityEth || '0'} ETH</span>
              </div>
              <div className="border-t border-[#1F2A37] pt-2 flex justify-between font-medium">
                <span className="text-[#E5E7EB]">Total</span>
                <span className="text-[#00FFA3] tabular-nums">
                  {(0.001 + parseFloat(form.liquidityEth || '0')).toFixed(4)} ETH
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#E5E7EB]">Review & Deploy</h2>
              <RiskBadge score={estimatedRisk} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Name', value: form.name || '—' },
                { label: 'Symbol', value: form.symbol || '—' },
                { label: 'Supply', value: parseInt(form.totalSupply || '0').toLocaleString() },
                { label: 'Chain', value: form.chainId === 8453 ? 'Base' : 'Ethereum' },
                { label: 'Liquidity', value: `${form.liquidityEth} ETH` },
                { label: 'Lock Duration', value: `${form.lockDurationDays} days` },
              ].map((item) => (
                <div key={item.label} className="bg-[#0B0F14] border border-[#1F2A37] rounded px-3 py-2">
                  <div className="text-[#9CA3AF] mb-0.5">{item.label}</div>
                  <div className="text-[#E5E7EB] font-medium tabular-nums">{item.value}</div>
                </div>
              ))}
            </div>

            {!isConnected && (
              <div className="bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] rounded p-3 text-xs text-[#F59E0B]">
                Please connect your wallet to deploy.
              </div>
            )}

            {txHash && (
              <div className="bg-[rgba(0,255,163,0.05)] border border-[rgba(0,255,163,0.2)] rounded p-3">
                <p className="text-xs text-[#00FFA3] font-medium mb-1">Transaction submitted!</p>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#9CA3AF] hover:text-[#3B82F6] transition-colors"
                >
                  {txHash.slice(0, 20)}...{txHash.slice(-8)}
                </a>
              </div>
            )}

            {error && (
              <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded p-3 text-xs text-[#EF4444]">
                {error}
              </div>
            )}

            <Button
              fullWidth
              loading={deploying}
              onClick={handleDeploy}
              disabled={!form.name || !form.symbol}
            >
              {isConnected ? `Deploy Token on ${form.chainId === 8453 ? 'Base' : 'Ethereum'}` : 'Connect Wallet to Deploy'}
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          ← Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 0 && (!form.name || !form.symbol)) ||
              (step === 1 && !form.totalSupply) ||
              (step === 2 && !form.liquidityEth)
            }
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  )
}
