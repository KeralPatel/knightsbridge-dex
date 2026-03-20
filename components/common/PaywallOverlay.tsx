'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface PaywallOverlayProps {
  requiredTier: 'pro' | 'enterprise'
  feature?: string
  children: React.ReactNode
  className?: string
}

export function PaywallOverlay({ requiredTier, feature, children, className = '' }: PaywallOverlayProps) {
  const tierLabel = requiredTier === 'pro' ? 'Pro' : 'Enterprise'
  const price = requiredTier === 'pro' ? '$99/mo' : '$499/mo'

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="paywall-blur pointer-events-none select-none">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[#11161D] border border-[#1F2A37] rounded-lg p-6 text-center max-w-xs mx-auto shadow-2xl">
          <div className="flex justify-center mb-3">
            <Badge variant={requiredTier === 'pro' ? 'blue' : 'yellow'} size="md">
              {tierLabel} Feature
            </Badge>
          </div>
          <div className="w-10 h-10 mx-auto mb-3 bg-[#1F2A37] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#E5E7EB] mb-1">
            {feature || `${tierLabel} Access Required`}
          </p>
          <p className="text-xs text-[#9CA3AF] mb-4">
            Upgrade to {tierLabel} for {price} to unlock this feature.
          </p>
          <Link href="/settings?tab=subscription">
            <Button size="sm" fullWidth>
              Upgrade to {tierLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface TieredAccessProps {
  children: React.ReactNode
  requiredTier: 'free' | 'pro' | 'enterprise'
  userTier: 'free' | 'pro' | 'enterprise'
  feature?: string
}

const TIER_RANK = { free: 0, pro: 1, enterprise: 2 }

export function TieredAccess({ children, requiredTier, userTier, feature }: TieredAccessProps) {
  const hasAccess = TIER_RANK[userTier] >= TIER_RANK[requiredTier]
  if (hasAccess) return <>{children}</>
  return (
    <PaywallOverlay requiredTier={requiredTier === 'free' ? 'pro' : requiredTier} feature={feature}>
      {children}
    </PaywallOverlay>
  )
}
