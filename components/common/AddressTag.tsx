'use client'

import { useState } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

interface AddressTagProps {
  address: string
  chainId?: number
  label?: string
  chars?: number
  showCopy?: boolean
  showLink?: boolean
  className?: string
}

export function AddressTag({
  address,
  chainId = 1,
  label,
  chars = 4,
  showCopy = true,
  showLink = true,
  className = '',
}: AddressTagProps) {
  const [copied, setCopied] = useState(false)

  const truncated = `${address.slice(0, chars + 2)}...${address.slice(-chars)}`

  const explorerUrl = chainId === 8453
    ? `https://basescan.org/address/${address}`
    : `https://etherscan.io/address/${address}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-mono text-xs text-[#9CA3AF]">
        {label || truncated}
      </span>
      {showCopy && (
        <Tooltip content={copied ? 'Copied!' : 'Copy address'}>
          <button
            onClick={handleCopy}
            className="text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors"
          >
            {copied ? (
              <svg className="w-3 h-3 text-[#00FFA3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </Tooltip>
      )}
      {showLink && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#9CA3AF] hover:text-[#3B82F6] transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </span>
  )
}
