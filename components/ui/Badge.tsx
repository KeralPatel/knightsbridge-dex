interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'green' | 'red' | 'blue' | 'yellow' | 'outline'
  size?: 'xs' | 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variants = {
  default:  'bg-[#1F2A37] text-[#9CA3AF]',
  green:    'bg-[rgba(0,255,163,0.1)] text-[#00FFA3] border border-[rgba(0,255,163,0.2)]',
  red:      'bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.2)]',
  blue:     'bg-[rgba(59,130,246,0.1)] text-[#3B82F6] border border-[rgba(59,130,246,0.2)]',
  yellow:   'bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]',
  outline:  'bg-transparent border border-[#1F2A37] text-[#9CA3AF]',
}

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', dot, className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'green' ? 'bg-[#00FFA3]' :
          variant === 'red' ? 'bg-[#EF4444]' :
          variant === 'blue' ? 'bg-[#3B82F6]' :
          'bg-[#9CA3AF]'
        }`} />
      )}
      {children}
    </span>
  )
}
