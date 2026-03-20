import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, extractToken } from '@/lib/security/jwt'

// Routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/user',
  '/api/launchpad/deploy',
  '/api/dex/swap',
  '/api/dex/simulate',
  '/api/intelligence',
]

// Routes that require Pro tier
const PRO_ROUTES = [
  '/api/intelligence/wallet',
  '/api/intelligence/smart-money',
  '/api/tokens',   // /api/tokens/[address]/holders
]

// Internal routes (HMAC auth only)
const INTERNAL_ROUTES = ['/api/internal']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-API routes for auth (Next.js handles page routes)
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Internal routes — validated by HMAC in route handler
  if (INTERNAL_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Check if route requires auth
  const requiresAuth = PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r))
  if (!requiresAuth) return NextResponse.next()

  // Extract and verify token
  const authHeader = request.headers.get('authorization')
  const token = extractToken(authHeader)

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await verifyToken(token)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.sub)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-tier', payload.tier)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
