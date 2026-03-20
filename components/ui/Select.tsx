'use client'

import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`
            w-full bg-[#0B0F14] border rounded px-3 py-2 text-sm text-[#E5E7EB]
            appearance-none cursor-pointer pr-8
            ${error ? 'border-[#EF4444]' : 'border-[#1F2A37] focus:border-[#00FFA3]'}
            focus:outline-none transition-colors
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#11161D]">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  )
}
