'use client'

import { useState, useRef } from 'react'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute z-50 ${positions[side]} pointer-events-none`}>
          <div className="bg-[#11161D] border border-[#1F2A37] text-[#E5E7EB] text-xs px-2.5 py-1.5 rounded whitespace-nowrap shadow-lg">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
