'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEthersContext } from '@/app/providers'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { RiskBadge } from '@/components/launchpad/RiskBadge'
import { Spinner } from '@/components/ui/Spinner'
import { ERC20_ABI } from '@/lib/ethers/contracts'

const COINGECKO_IDS: Record<string, string> = {
  ETH:  'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  UNI:  'uniswap',
}

// Mainnet tokens
const MAINNET_TOKENS = [
  { symbol: 'ETH',  address: 'ETH',                                           logo: '⟠', price: 0, chainId: 1, decimals: 18 },
  { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', logo: '💲', price: 0, chainId: 1, decimals: 6  },
  { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', logo: '💵', price: 0, chainId: 1, decimals: 6  },
  { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', logo: '₿', price: 0, chainId: 1, decimals: 8  },
  { symbol: 'LINK', address: '0x514910771af9ca656af840dff83e8264ecf986ca', logo: '⬡', price: 0, chainId: 1, decimals: 18 },
  { symbol: 'UNI',  address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', logo: '🦄', price: 0, chainId: 1, decimals: 18 },
]

// Sepolia testnet tokens (0x Sepolia supported tokens)
const SEPOLIA_TOKENS = [
  { symbol: 'ETH',  address: 'ETH',                                           logo: '⟠', price: 0, chainId: 11155111, decimals: 18 },
  { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', logo: '💲', price: 1, chainId: 11155111, decimals: 6  },
  { symbol: 'WETH', address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', logo: '⟠', price: 0, chainId: 11155111, decimals: 18 },
  { symbol: 'LINK', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', logo: '⬡', price: 0, chainId: 11155111, decimals: 18 },
]

const BASE_TOKENS = MAINNET_TOKENS

interface Token { symbol: string; address: string; logo: string; price: number; chainId: number; decimals: number }

interface QuoteData {
  price: string
  priceImpact: string
  buyAmount: string
  estimatedGas: string
  route?: { name: string; proportion: string }[]
}

interface SwapTxData {
  txData: { to: string; data: string; value: string }
  allowanceTarget: string
  priceImpact: string
  estimatedGas: string
}

function TokenSelectorModal({ open, onClose, onSelect, exclude, tokenList }: {
  open: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  exclude?: string
  tokenList: Token[]
}) {
  const [search, setSearch] = useState('')
  const filtered = tokenList.filter(
    (t) => t.address !== exclude &&
    (t.symbol.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Modal open={open} onClose={onClose} title="Select Token" width="max-w-sm">
      <input
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by symbol..."
        className="w-full bg-[#0B0F14] border border-[#1F2A37] rounded px-3 py-2 text-sm text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:border-[#00FFA3] focus:outline-none mb-3"
      />
      <div className="space-y-1">
        {filtered.map((token) => (
          <button
            key={token.address}
            onClick={() => { onSelect(token); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#1F2A37] transition-colors text-left"
          >
            <span className="text-xl">{token.logo}</span>
            <div>
              <div className="text-sm font-semibold text-[#E5E7EB]">{token.symbol}</div>
              <div className="text-xs text-[#9CA3AF] font-mono">{token.address === 'ETH' ? 'Native' : `${token.address.slice(0, 10)}...`}</div>
            </div>
            <span className="ml-auto text-xs tabular-nums text-[#9CA3AF]">${token.price.toLocaleString()}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default function DexPage() {
  const { isConnected, connect, address, signer, chainId } = useEthersContext()
  const isSepolia = chainId === 11155111
  const defaultTokens = isSepolia ? SEPOLIA_TOKENS : MAINNET_TOKENS
  const [tokens, setTokens] = useState<Token[]>(defaultTokens)
  const [sellToken, setSellToken] = useState<Token>(defaultTokens[0])
  const [buyToken, setBuyToken] = useState<Token>(defaultTokens[1])
  const [sellAmount, setSellAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [customSlippage, setCustomSlippage] = useState('')
  const [showSellSelector, setShowSellSelector] = useState(false)
  const [showBuySelector, setShowBuySelector] = useState(false)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [swapTx, setSwapTx] = useState<SwapTxData | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [swapLoading, setSwapLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [simulationPassed, setSimulationPassed] = useState<boolean | null>(null)

  // Reset token list when chain changes
  useEffect(() => {
    const list = chainId === 11155111 ? SEPOLIA_TOKENS : MAINNET_TOKENS
    setTokens(list)
    setSellToken(list[0])
    setBuyToken(list[1])
    setQuote(null)
    setSellAmount('')
  }, [chainId])

  // Fetch live prices from CoinGecko every 60s (mainnet only)
  useEffect(() => {
    if (chainId === 11155111) return // Sepolia prices are ~fake anyway
    const ids = Object.values(COINGECKO_IDS).join(',')
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
          { next: { revalidate: 60 } }
        )
        if (!res.ok) return
        const data = await res.json()
        setTokens(prev => prev.map(t => ({
          ...t,
          price: data[COINGECKO_IDS[t.symbol]]?.usd ?? t.price,
        })))
        // Update currently selected tokens if their prices changed
        setSellToken(prev => ({ ...prev, price: data[COINGECKO_IDS[prev.symbol]]?.usd ?? prev.price }))
        setBuyToken(prev => ({ ...prev, price: data[COINGECKO_IDS[prev.symbol]]?.usd ?? prev.price }))
      } catch { /* silently ignore — stale price shown */ }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [])

  const effectiveSlippage = customSlippage || slippage

  const fetchQuote = useCallback(async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      setQuote(null)
      setSwapTx(null)
      return
    }

    setQuoteLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/dex/quote?sellToken=${sellToken.address}&buyToken=${buyToken.address}&sellAmount=${sellAmount}&chainId=${chainId || 1}&decimals=${sellToken.decimals}&buyDecimals=${buyToken.decimals}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuote(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Quote failed'
      if (!msg.includes('API key')) setError(msg)
    } finally {
      setQuoteLoading(false)
    }
  }, [sellAmount, sellToken, buyToken, chainId])

  useEffect(() => {
    const t = setTimeout(fetchQuote, 500)
    return () => clearTimeout(t)
  }, [fetchQuote])

  const handleSimulateAndSwap = async () => {
    if (!isConnected) { connect(); return }
    if (!quote || !address) return

    setSwapLoading(true)
    setError('')
    setSimulationPassed(null)

    try {
      // 1. Get swap tx data
      const swapRes = await fetch(
        `/api/dex/swap?sellToken=${sellToken.address}&buyToken=${buyToken.address}&sellAmount=${sellAmount}&takerAddress=${address}&slippage=${effectiveSlippage}&chainId=${chainId || 1}&decimals=${sellToken.decimals}`
      )
      const swapData = await swapRes.json()
      if (!swapRes.ok) throw new Error(swapData.error)
      setSwapTx(swapData)

      // 2. Simulate transaction (advisory — does not block the swap)
      try {
        const simRes = await fetch('/api/dex/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: swapData.txData.to,
            data: swapData.txData.data,
            value: swapData.txData.value,
            from: address,
            chainId: chainId || 1,
          }),
        })
        const simData = await simRes.json()
        setSimulationPassed(simData.success)
        // Simulation failures are warnings only — MetaMask will show its own confirmation
      } catch {
        // Ignore simulation errors — proceed to wallet confirmation
      }

      // 3. Check and set allowance if needed
      if (swapData.allowanceTarget && sellToken.address !== 'ETH') {
        const token = new ethers.Contract(sellToken.address, ERC20_ABI, signer!)
        const allowance: bigint = await token.allowance(address, swapData.allowanceTarget)
        const required = ethers.parseUnits(sellAmount, sellToken.decimals)

        if (allowance < required) {
          const approveTx = await token.approve(swapData.allowanceTarget, ethers.MaxUint256)
          await approveTx.wait()
        }
      }

      // 4. Execute swap
      const tx = await signer!.sendTransaction({
        to: swapData.txData.to,
        data: swapData.txData.data,
        value: BigInt(swapData.txData.value),
      })
      setTxHash(tx.hash)
      await tx.wait()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Swap failed'
      setError(msg.includes('user rejected') ? 'Transaction cancelled' : msg)
    } finally {
      setSwapLoading(false)
    }
  }

  const swapTokens = () => {
    setSellToken(buyToken)
    setBuyToken(sellToken)
    setSellAmount('')
    setQuote(null)
  }

  const priceImpact = parseFloat(quote?.priceImpact || '0')
  const highImpact = priceImpact > 5
  const criticalImpact = priceImpact > 15

  return (
    <div className="p-5 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#E5E7EB]">DEX — Aggregated Swap</h1>
        <p className="text-sm text-[#9CA3AF] mt-0.5">Best-rate execution via 0x Protocol aggregator</p>
      </div>

      {isSepolia && (
        <div className="mb-4 flex items-center gap-2 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.3)] rounded-lg px-4 py-2.5 text-xs text-[#F59E0B]">
          <span className="font-semibold">⚠ Sepolia Testnet</span>
          <span className="text-[rgba(245,158,11,0.7)]">— No real funds. Transactions use test ETH only.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Swap Widget */}
        <div className="lg:col-span-2">
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg overflow-hidden">
            {/* Slippage settings */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
              <span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">Slippage Tolerance</span>
              <div className="flex items-center gap-1">
                {['0.1', '0.5', '1.0'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSlippage(s); setCustomSlippage('') }}
                    className={`text-xs px-2.5 py-1 rounded transition-colors
                      ${slippage === s && !customSlippage ? 'bg-[#00FFA3] text-[#0B0F14] font-medium' : 'text-[#9CA3AF] hover:bg-[#1F2A37]'}`}
                  >
                    {s}%
                  </button>
                ))}
                <input
                  type="number"
                  value={customSlippage}
                  onChange={(e) => setCustomSlippage(e.target.value)}
                  placeholder="Custom"
                  className="w-16 text-xs bg-[#0B0F14] border border-[#1F2A37] rounded px-2 py-1 text-[#E5E7EB] focus:border-[#00FFA3] focus:outline-none"
                />
                {customSlippage && <span className="text-xs text-[#9CA3AF]">%</span>}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {/* Sell */}
              <div className="bg-[#0B0F14] rounded-lg border border-[#1F2A37] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#9CA3AF]">You Pay</span>
                  <span className="text-xs text-[#9CA3AF]">Balance: 0.0000 {sellToken.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSellSelector(true)}
                    className="flex items-center gap-2 bg-[#1F2A37] hover:bg-[#2d3f52] transition-colors px-3 py-2 rounded-lg shrink-0"
                  >
                    <span className="text-lg">{sellToken.logo}</span>
                    <span className="text-sm font-semibold text-[#E5E7EB]">{sellToken.symbol}</span>
                    <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="0.0"
                    className="flex-1 text-right text-2xl font-semibold bg-transparent border-0 outline-none text-[#E5E7EB] tabular-nums placeholder:text-[#9CA3AF]"
                  />
                </div>
                {sellAmount && sellToken.price > 0 && (
                  <div className="text-right text-xs text-[#9CA3AF] mt-1 tabular-nums">
                    ≈ ${(parseFloat(sellAmount) * sellToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <button
                  onClick={swapTokens}
                  className="w-9 h-9 bg-[#1F2A37] hover:bg-[#2d3f52] border border-[#1F2A37] rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16V4m0 0L4 7m3-3l3 3M17 8v12m0 0l3-3m-3 3l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Buy */}
              <div className="bg-[#0B0F14] rounded-lg border border-[#1F2A37] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#9CA3AF]">You Receive</span>
                  <span className="text-xs text-[#9CA3AF]">Balance: 0.0000 {buyToken.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBuySelector(true)}
                    className="flex items-center gap-2 bg-[#1F2A37] hover:bg-[#2d3f52] transition-colors px-3 py-2 rounded-lg shrink-0"
                  >
                    <span className="text-lg">{buyToken.logo}</span>
                    <span className="text-sm font-semibold text-[#E5E7EB]">{buyToken.symbol}</span>
                    <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="flex-1 text-right">
                    {quoteLoading ? (
                      <div className="flex justify-end"><Spinner size="sm" /></div>
                    ) : (
                      <div className="text-2xl font-semibold text-[#00FFA3] tabular-nums">
                        {quote?.buyAmount
                          ? (parseFloat(quote.buyAmount) / Math.pow(10, buyToken.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })
                          : '0.0'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote details */}
              {quote && sellAmount && !quoteLoading && (
                <div className="bg-[#0B0F14] rounded border border-[#1F2A37] px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Rate</span>
                    <span className="text-[#E5E7EB] tabular-nums">
                      1 {sellToken.symbol} = {parseFloat(quote.price || '0').toFixed(6)} {buyToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Price Impact</span>
                    <span className={criticalImpact ? 'text-[#EF4444] font-semibold' : highImpact ? 'text-[#F59E0B]' : 'text-[#00FFA3]'}>
                      {quote.priceImpact}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Slippage</span>
                    <span className="text-[#E5E7EB]">{effectiveSlippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Est. Gas</span>
                    <span className="text-[#E5E7EB] tabular-nums">{parseInt(quote.estimatedGas || '0').toLocaleString()} gwei</span>
                  </div>
                </div>
              )}

              {/* Price impact warning */}
              {criticalImpact && (
                <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded p-3 text-xs text-[#EF4444]">
                  ⚠️ <strong>HIGH PRICE IMPACT ({quote?.priceImpact}%)</strong> — You may lose significant value. Consider reducing trade size.
                </div>
              )}

              {/* Simulation result — advisory only */}
              {simulationPassed !== null && (
                <div className={`rounded p-3 text-xs ${simulationPassed
                  ? 'bg-[rgba(0,255,163,0.05)] border border-[rgba(0,255,163,0.2)] text-[#00FFA3]'
                  : 'bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.2)] text-[#F59E0B]'
                }`}>
                  {simulationPassed
                    ? '✓ Simulation passed — transaction looks good'
                    : '⚠ Simulation warning — your wallet will confirm before any funds move'}
                </div>
              )}

              {error && (
                <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded p-3 text-xs text-[#EF4444]">
                  {error}
                </div>
              )}

              {txHash && (
                <div className="bg-[rgba(0,255,163,0.05)] border border-[rgba(0,255,163,0.2)] rounded p-3">
                  <p className="text-xs text-[#00FFA3] font-medium mb-1">Swap successful!</p>
                  <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-[#9CA3AF] hover:text-[#3B82F6]">
                    {txHash.slice(0, 20)}...{txHash.slice(-8)} ↗
                  </a>
                </div>
              )}

              <Button
                fullWidth
                loading={swapLoading}
                onClick={handleSimulateAndSwap}
                variant={criticalImpact ? 'danger' : 'primary'}
                disabled={!sellAmount || parseFloat(sellAmount) <= 0 || quoteLoading}
              >
                {!isConnected ? 'Connect Wallet' :
                  swapLoading ? 'Swapping...' :
                  criticalImpact ? `Swap Anyway (${quote?.priceImpact}% impact)` :
                  'Swap'}
              </Button>
            </div>
          </div>
        </div>

        {/* Pre-swap intelligence panel */}
        <div className="space-y-3">
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Token Intelligence</h3>

            {/* Risk score for buy token */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">Risk Score ({buyToken.symbol})</span>
                <RiskBadge score={23} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">Smart Money</span>
                <Badge variant="green" size="xs">4 wallets buying</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">Liquidity</span>
                <span className="text-xs text-[#00FFA3] font-medium">$42.3M ✓</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">LP Lock</span>
                <Badge variant="green" size="xs">Locked 365d</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">Honeypot</span>
                <Badge variant="green" size="xs">Not detected</Badge>
              </div>
            </div>
          </div>

          {/* Route display */}
          {quote?.route && (
            <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Route</h3>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs bg-[#1F2A37] text-[#E5E7EB] px-2 py-1 rounded font-mono">{sellToken.symbol}</span>
                {(quote.route as {name: string; proportion: string}[]).slice(0, 3).map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs bg-[#1F2A37] text-[#3B82F6] px-2 py-1 rounded">{step.name}</span>
                  </span>
                ))}
                <svg className="w-3 h-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs bg-[#1F2A37] text-[#E5E7EB] px-2 py-1 rounded font-mono">{buyToken.symbol}</span>
              </div>
            </div>
          )}

          {/* Recent signals for buy token */}
          <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Recent Signals</h3>
            <div className="space-y-2">
              {[
                { text: '3 smart wallets bought in last hour', severity: 'green' },
                { text: 'Volume spike +340% vs 1h average', severity: 'blue' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${s.severity === 'green' ? 'bg-[#00FFA3]' : 'bg-[#3B82F6]'}`} />
                  <span className="text-[#9CA3AF]">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Token Selector Modals */}
      <TokenSelectorModal
        open={showSellSelector}
        onClose={() => setShowSellSelector(false)}
        onSelect={setSellToken}
        exclude={buyToken.address}
        tokenList={tokens}
      />
      <TokenSelectorModal
        open={showBuySelector}
        onClose={() => setShowBuySelector(false)}
        onSelect={setBuyToken}
        exclude={sellToken.address}
        tokenList={tokens}
      />
    </div>
  )
}
