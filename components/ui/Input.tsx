'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 flex items-center text-[#9CA3AF] pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full bg-[#0B0F14] border rounded px-3 py-2 text-sm text-[#E5E7EB]
              placeholder:text-[#9CA3AF] transition-colors
              ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#1F2A37] focus:border-[#00FFA3]'}
              focus:outline-none
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-8' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 flex items-center text-[#9CA3AF]">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
