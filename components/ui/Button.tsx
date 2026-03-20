'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-[#00FFA3] text-[#0B0F14] font-semibold hover:bg-[#00e691] active:bg-[#00cc80] border border-transparent',
  secondary: 'bg-[#3B82F6] text-white font-semibold hover:bg-[#2563eb] active:bg-[#1d4ed8] border border-transparent',
  ghost: 'bg-transparent text-[#E5E7EB] hover:bg-[#1F2A37] border border-transparent',
  danger: 'bg-[#EF4444] text-white font-semibold hover:bg-[#dc2626] active:bg-[#b91c1c] border border-transparent',
  outline: 'bg-transparent text-[#E5E7EB] border border-[#1F2A37] hover:border-[#2d3f52] hover:bg-[#11161D]',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-5 py-2.5 text-base rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          transition-colors duration-150 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          select-none whitespace-nowrap
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
