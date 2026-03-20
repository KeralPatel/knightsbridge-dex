import { logger } from './logger'

interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30_000,
    backoffMultiplier = 2,
  } = options

  let lastError: unknown
  let delay = initialDelayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts) break

      logger.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, err)
      await sleep(delay)
      delay = Math.min(delay * backoffMultiplier, maxDelayMs)
    }
  }

  throw lastError
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
