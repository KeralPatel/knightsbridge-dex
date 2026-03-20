import crypto from 'crypto'

const HMAC_SECRET = process.env.WORKER_HMAC_SECRET || 'dev-hmac-secret-replace-in-production'

export function signPayload(payload: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
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

export function verifyWorkerRequest(req: Request, body: string): boolean {
  const signature = req.headers.get('x-worker-signature')
  if (!signature) return false
  return verifyHmac(body, signature)
}
