'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: Date | string
  label?: string
  onExpire?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function CountdownTimer({ targetDate, label = 'Launches in', onExpire }: CountdownTimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(target))
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft(target)
      setTimeLeft(t)
      if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
        setExpired(true)
        onExpire?.()
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [target, onExpire])

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#00FFA3]">
        <span className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full live-dot" />
        <span className="font-medium">LIVE NOW</span>
      </div>
    )
  }

  return (
    <div>
      {label && <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">{label}</p>}
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <>
            <TimeUnit value={timeLeft.days} unit="d" />
            <span className="text-[#9CA3AF] text-xs">:</span>
          </>
        )}
        <TimeUnit value={timeLeft.hours} unit="h" />
        <span className="text-[#9CA3AF] text-xs">:</span>
        <TimeUnit value={timeLeft.minutes} unit="m" />
        <span className="text-[#9CA3AF] text-xs">:</span>
        <TimeUnit value={timeLeft.seconds} unit="s" />
      </div>
    </div>
  )
}

function TimeUnit({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="text-center">
      <span className="text-sm font-semibold text-[#E5E7EB] tabular-nums font-mono">{pad(value)}</span>
      <span className="text-[9px] text-[#9CA3AF] ml-0.5">{unit}</span>
    </div>
  )
}
