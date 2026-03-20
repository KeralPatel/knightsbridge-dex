import crypto from 'crypto'

function getHmacSecret(): string {
  const s = process.env.WORKER_HMAC_SECRET
  if (!s) throw new Error('WORKER_HMAC_SECRET env var is not set')
  return s
}

export function signPayload(payload: string): string {
  return crypto
    .createHmac('sha256', getHmacSecret())
    .update(payload)
    .digest('hex')
}

export function verifyHmac(payload: string, signature: string): boolean {
  const expected = signPayload(payload)
  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

export function verifyWorkerRequest(body: string, signature: string, timestamp: string): boolean {
  if (!signature || !timestamp) return false
  // Reject requests older than 5 minutes
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false
  const expected = signPayload(`${timestamp}.${body}`)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}
