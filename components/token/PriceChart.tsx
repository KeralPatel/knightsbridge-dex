'use client'

import { useEffect, useRef, useState } from 'react'

interface PricePoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface PriceChartProps {
  tokenAddress: string
  chainId: number
}

type Resolution = '1h' | '4h' | '1d'

const MOCK_CANDLES: PricePoint[] = Array.from({ length: 72 }, (_, i) => {
  const base = 0.00012 + Math.sin(i * 0.3) * 0.00003 + Math.random() * 0.00001
  return {
    time: Math.floor(Date.now() / 1000) - (72 - i) * 3600,
    open: base,
    high: base * (1 + Math.random() * 0.05),
    low: base * (1 - Math.random() * 0.05),
    close: base * (1 + (Math.random() - 0.5) * 0.04),
    volume: Math.random() * 50000 + 10000,
  }
})

export function PriceChart({ tokenAddress, chainId }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<unknown>(null)
  const [resolution, setResolution] = useState<Resolution>('1h')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chart: any = null

    const init = async () => {
      if (!containerRef.current) return

      try {
        // Dynamic import to avoid SSR issues
        const { createChart } = await import('lightweight-charts')

        const container = containerRef.current
        chart = createChart(container, {
          width: container.clientWidth,
          height: 320,
          layout: {
            background: { color: '#0B0F14' },
            textColor: '#9CA3AF',
          },
          grid: {
            vertLines: { color: '#1F2A37' },
            horzLines: { color: '#1F2A37' },
          },
          crosshair: {
            vertLine: { color: '#374151', style: 1 },
            horzLine: { color: '#374151', style: 1 },
          },
          rightPriceScale: {
            borderColor: '#1F2A37',
          },
          timeScale: {
            borderColor: '#1F2A37',
            timeVisible: true,
            secondsVisible: false,
          },
        })

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#00FFA3',
          downColor: '#EF4444',
          borderUpColor: '#00FFA3',
          borderDownColor: '#EF4444',
          wickUpColor: '#00FFA3',
          wickDownColor: '#EF4444',
        })

        const volumeSeries = chart.addHistogramSeries({
          color: '#3B82F6',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        })

        chart.applyOptions({
          rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.25 } },
        })

        candleSeries.setData(MOCK_CANDLES.map((c) => ({
          time: c.time as unknown as import('lightweight-charts').Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })))

        volumeSeries.setData(MOCK_CANDLES.map((c) => ({
          time: c.time as unknown as import('lightweight-charts').Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(0, 255, 163, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        })))

        chart.timeScale().fitContent()
        chartRef.current = chart

        // Resize observer
        const ro = new ResizeObserver(() => {
          if (container && chart) {
            chart.applyOptions({ width: container.clientWidth })
          }
        })
        ro.observe(container)

        setIsLoading(false)
        return () => ro.disconnect()
      } catch (err) {
        console.error('Chart init error:', err)
        setIsLoading(false)
      }
    }

    const cleanup = init()
    return () => {
      cleanup.then((fn) => fn?.())
      if (chart) chart.remove()
    }
  }, [tokenAddress, chainId, resolution])

  return (
    <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg overflow-hidden">
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2A37]">
        <span className="text-sm font-semibold text-[#E5E7EB]">Price Chart</span>
        <div className="flex items-center gap-1">
          {(['1h', '4h', '1d'] as Resolution[]).map((r) => (
            <button
              key={r}
              onClick={() => setResolution(r)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                resolution === r
                  ? 'bg-[#1F2A37] text-[#E5E7EB]'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F14] z-10">
            <div className="w-6 h-6 border-2 border-[#00FFA3] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ height: 320 }} />
      </div>
    </div>
  )
}
