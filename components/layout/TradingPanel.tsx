'use client'

import { useState, useEffect } from 'react'
import { useEthersContext } from '@/app/providers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const POPULAR_TOKENS = [
  { symbol: 'ETH', address: 'native', price: 3412.50 },
  { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', price: 67823.00 },
  { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', price: 1.00 },
  { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', price: 1.00 },
]

export function TradingPanel() {
  const { isConnected, connect } = useEthersContext()
  const [sellToken, setSellToken] = useState('ETH')
  const [buyToken, setBuyToken] = useState('USDC')
  const [sellAmount, setSellAmount] = useState('')
  const [buyAmount, setBuyAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<{ price?: string; priceImpact?: string } | null>(null)

  // Fetch quote on amount change
  useEffect(() => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      setBuyAmount('')
      setQuote(null)
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dex/quote?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}&chainId=1`)
        if (res.ok) {
          const data = await res.json()
          setBuyAmount(data.buyAmount || '')
          setQuote(data)
        }
      } catch { /* silent */ }
    }, 400)
    return () => clearTimeout(timeout)
  }, [sellAmount, sellToken, buyToken])

  const handleSwap = async () => {
    if (!isConnected) { connect(); return }
    setLoading(true)
    try {
      // Navigate to full DEX page for complete swap flow
      window.location.href = `/dex?sell=${sellToken}&buy=${buyToken}&amount=${sellAmount}`
    } finally {
      setLoading(false)
    }
  }

  const swapTokens = () => {
    setSellToken(buyToken)
    setBuyToken(sellToken)
    setSellAmount(buyAmount)
    setBuyAmount(sellAmount)
  }

  return (
    <div className="w-[320px] min-w-[320px] bg-[#11161D] border-l border-[#1F2A37] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1F2A37] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#E5E7EB]">Swap</span>
        <div className="flex items-center gap-1">
          {['0.1', '0.5', '1.0'].map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`text-xs px-2 py-0.5 rounded transition-colors
                ${slippage === s
                  ? 'bg-[#00FFA3] text-[#0B0F14] font-medium'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {/* Sell */}
        <div className="bg-[#0B0F14] rounded border border-[#1F2A37] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9CA3AF]">You Pay</span>
            <span className="text-xs text-[#9CA3AF]">Balance: 0.00</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sellToken}
              onChange={(e) => setSellToken(e.target.value)}
              className="bg-[#1F2A37] text-sm text-[#E5E7EB] rounded px-2 py-1.5 border-0 outline-none cursor-pointer font-medium"
            >
              {POPULAR_TOKENS.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
            </select>
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0.0"
              className="bg-transparent border-0 outline-none text-right text-lg font-semibold text-[#E5E7EB] w-full tabular-nums placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Swap button */}
        <button
          onClick={swapTokens}
          className="mx-auto w-8 h-8 bg-[#1F2A37] hover:bg-[#2d3f52] rounded border border-[#1F2A37] flex items-center justify-center transition-colors z-10 -my-1 self-center"
        >
          <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 16V4m0 0L4 7m3-3l3 3M17 8v12m0 0l3-3m-3 3l-3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Buy */}
        <div className="bg-[#0B0F14] rounded border border-[#1F2A37] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9CA3AF]">You Receive</span>
            <span className="text-xs text-[#9CA3AF]">Balance: 0.00</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={buyToken}
              onChange={(e) => setBuyToken(e.target.value)}
              className="bg-[#1F2A37] text-sm text-[#E5E7EB] rounded px-2 py-1.5 border-0 outline-none cursor-pointer font-medium"
            >
              {POPULAR_TOKENS.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
            </select>
            <div className="text-right text-lg font-semibold text-[#00FFA3] w-full tabular-nums">
              {buyAmount ? parseFloat(buyAmount).toFixed(4) : '0.0'}
            </div>
          </div>
        </div>

        {/* Quote info */}
        {quote && sellAmount && (
          <div className="text-xs text-[#9CA3AF] space-y-1 px-1">
            <div className="flex justify-between">
              <span>Rate</span>
              <span className="text-[#E5E7EB] tabular-nums">{quote.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Price Impact</span>
              <span className={parseFloat(quote.priceImpact || '0') > 5 ? 'text-[#EF4444]' : 'text-[#E5E7EB]'}>
                {quote.priceImpact}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Slippage</span>
              <span className="text-[#E5E7EB]">{slippage}%</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          fullWidth
          onClick={handleSwap}
          loading={loading}
          className="mt-1"
          disabled={!sellAmount || parseFloat(sellAmount) <= 0}
        >
          {!isConnected ? 'Connect Wallet' : 'Swap'}
        </Button>

        {/* Link to full DEX */}
        <a href="/dex" className="text-center text-xs text-[#9CA3AF] hover:text-[#00FFA3] transition-colors">
          Advanced DEX →
        </a>
      </div>
    </div>
  )
}
