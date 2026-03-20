import { createAdminClient } from '@/lib/supabase/admin'

const WINDOW_MS = 60 * 1000  // 1-minute sliding window

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// In-memory fallback for non-API-key requests (per IP)
const ipCounters = new Map<string, { count: number; resetAt: number }>()
const IP_LIMIT = 60  // 60 req/min for unauthenticated

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function rateLimitApiKey(keyId: string, limitPerMinute: number, endpoint: string): Promise<RateLimitResult> {
  const supabase = createAdminClient()
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  // Count requests in window
  const { count, error } = await supabase
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('key_id', keyId)
    .gte('timestamp', windowStart)

  if (error) {
    // Fail open on DB error
    return { allowed: true, remaining: limitPerMinute, resetAt: Date.now() + WINDOW_MS }
  }

  const used = count || 0
  const allowed = used < limitPerMinute

  if (allowed) {
    // Record this request (fire-and-forget)
    supabase.from('api_key_usage').insert({ key_id: keyId, endpoint }).then(() => {})
    // Update last_used_at
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyId).then(() => {})
  }

  return {
    allowed,
    remaining: Math.max(0, limitPerMinute - used - 1),
    resetAt: Date.now() + WINDOW_MS,
  }
}

export function rateLimitIp(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = ipCounters.get(ip)

  if (!entry || entry.resetAt < now) {
    ipCounters.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: IP_LIMIT - 1, resetAt: now + WINDOW_MS }
  }

  entry.count++
  const allowed = entry.count <= IP_LIMIT
  return {
    allowed,
    remaining: Math.max(0, IP_LIMIT - entry.count),
    resetAt: entry.resetAt,
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  }
}
