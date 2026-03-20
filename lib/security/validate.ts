import { z } from 'zod'

// ─── Address Validation ────────────────────────────────────────────────────────
export const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address')
  .transform((addr) => addr.toLowerCase())

export const chainIdSchema = z
  .number()
  .int()
  .refine((id) => [1, 8453, 11155111].includes(id), 'Unsupported chain ID')

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(30).optional(),
})

// ─── Token Schemas ─────────────────────────────────────────────────────────────
export const tokenQuerySchema = z.object({
  q: z.string().max(100).optional(),
  chain: z.coerce.number().optional(),
  sort: z.enum(['volume', 'risk', 'newest', 'market_cap']).optional().default('volume'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

// ─── Launchpad Schemas ─────────────────────────────────────────────────────────
export const createListingSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10).toUpperCase(),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().max(100).optional(),
  telegram: z.string().max(100).optional(),
  totalSupply: z.string().regex(/^\d+$/, 'Must be a positive integer'),
  liquidityEth: z.string().optional(),
  lockDurationDays: z.coerce.number().int().min(30).max(3650).optional().default(90),
  launchAt: z.string().datetime().optional(),
  creatorWallet: addressSchema,
  chainId: chainIdSchema,
})

// ─── DEX Schemas ──────────────────────────────────────────────────────────────
export const dexQuoteSchema = z.object({
  sellToken: z.string().min(1).max(100),
  buyToken: z.string().min(1).max(100),
  sellAmount: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
  chainId: z.coerce.number().optional().default(1),
  takerAddress: addressSchema.optional(),
  slippage: z.coerce.number().min(0).max(50).optional().default(0.5),
  decimals: z.coerce.number().int().min(0).max(18).optional().default(18),
  buyDecimals: z.coerce.number().int().min(0).max(18).optional().default(18),
})

export const simulateSchema = z.object({
  to: addressSchema,
  data: z.string().regex(/^0x[0-9a-fA-F]*$/),
  value: z.string().regex(/^\d+$/).optional().default('0'),
  from: addressSchema,
  chainId: z.coerce.number().optional().default(1),
})

// ─── API Key Schemas ───────────────────────────────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
})

// ─── Signal Schemas ────────────────────────────────────────────────────────────
export const signalQuerySchema = z.object({
  type: z.string().optional(),
  chain: z.enum(['1', '8453']).optional(),
  token: z.string().optional(),
  minStrength: z.coerce.number().min(0).max(100).optional().default(0),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

export const ingestSignalSchema = z.object({
  type: z.enum([
    'smart_money_entry', 'large_transfer', 'insider_buy', 'liquidity_removal',
    'rug_pattern', 'honeypot_detected', 'dev_wallet_move', 'whale_accumulation', 'unusual_volume'
  ]),
  chain: z.enum(['1', '8453']),
  tokenAddress: addressSchema.optional(),
  walletAddress: addressSchema.optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  strength: z.number().int().min(1).max(100),
  tierRequired: z.enum(['free', 'pro', 'enterprise']).default('free'),
  metadata: z.record(z.unknown()).optional().default({}),
  txHash: z.string().optional(),
  blockNumber: z.coerce.number().optional(),
})

// ─── Wallet Schemas ────────────────────────────────────────────────────────────
export const walletQuerySchema = z.object({
  chain: z.enum(['1', '8453']).optional().default('1'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})
