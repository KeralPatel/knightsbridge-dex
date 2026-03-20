import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const KEY_PREFIX = 'kbdex_'
const SALT_ROUNDS = 10

export function generateApiKey(): { key: string; prefix: string } {
  const random = crypto.randomBytes(32).toString('hex')
  const key = `${KEY_PREFIX}${random}`
  const prefix = key.slice(0, KEY_PREFIX.length + 8)  // show first 8 random chars
  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, SALT_ROUNDS)
}

export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}

export function extractPrefix(key: string): string {
  return key.slice(0, KEY_PREFIX.length + 8)
}
