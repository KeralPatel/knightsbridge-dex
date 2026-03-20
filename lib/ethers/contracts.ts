import { ethers } from 'ethers'
import { getProvider } from './provider'

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const TOKEN_FACTORY_ABI = [
  'event TokenDeployed(address indexed token, address indexed creator, string name, string symbol, uint256 supply)',
  'function deployToken(string name, string symbol, uint256 supply, uint256 lockDurationDays, uint256 liquidityEth) payable',
  'function getCreatorTokens(address creator) view returns (address[])',
  'function getAllTokens() view returns (address[])',
  'function deployFee() view returns (uint256)',
  'function liquidityLocker() view returns (address)',
  'function isKnightsbridgeToken(address) view returns (bool)',
]

export const LIQUIDITY_LOCKER_ABI = [
  'event Locked(uint256 indexed lockId, address indexed token, address indexed owner, uint256 unlockAt)',
  'event Unlocked(uint256 indexed lockId, address indexed owner)',
  'function lockLiquidity(address token, address owner, uint256 durationDays) payable',
  'function unlock(uint256 lockId)',
  'function extendLock(uint256 lockId, uint256 additionalDays)',
  'function getLocksByToken(address token) view returns (tuple(address token, address owner, uint256 amount, uint256 lockedAt, uint256 unlockAt, bool withdrawn)[])',
  'function getLocksByOwner(address owner) view returns (tuple(address token, address owner, uint256 amount, uint256 lockedAt, uint256 unlockAt, bool withdrawn)[])',
  'function locks(uint256) view returns (address token, address owner, uint256 amount, uint256 lockedAt, uint256 unlockAt, bool withdrawn)',
]

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
]

export const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
]

export const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
]

// ─── Contract Addresses ────────────────────────────────────────────────────────
export const CONTRACT_ADDRESSES = {
  1: {
    tokenFactory: process.env.NEXT_PUBLIC_TOKEN_FACTORY_ETH || '',
    liquidityLocker: process.env.NEXT_PUBLIC_LIQUIDITY_LOCKER_ETH || '',
    uniswapV2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  8453: {
    tokenFactory: process.env.NEXT_PUBLIC_TOKEN_FACTORY_BASE || '',
    liquidityLocker: process.env.NEXT_PUBLIC_LIQUIDITY_LOCKER_BASE || '',
    uniswapV2Factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    uniswapV3Factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
    weth: '0x4200000000000000000000000000000000000006',
  },
}

// ─── Contract Getters ─────────────────────────────────────────────────────────
export function getTokenFactory(chainId: number = 1, signerOrProvider?: ethers.ContractRunner) {
  const addr = CONTRACT_ADDRESSES[chainId as 1 | 8453]?.tokenFactory
  if (!addr) throw new Error(`TokenFactory not deployed on chain ${chainId}`)
  return new ethers.Contract(addr, TOKEN_FACTORY_ABI, signerOrProvider || getProvider(chainId))
}

export function getLiquidityLocker(chainId: number = 1, signerOrProvider?: ethers.ContractRunner) {
  const addr = CONTRACT_ADDRESSES[chainId as 1 | 8453]?.liquidityLocker
  if (!addr) throw new Error(`LiquidityLocker not deployed on chain ${chainId}`)
  return new ethers.Contract(addr, LIQUIDITY_LOCKER_ABI, signerOrProvider || getProvider(chainId))
}

export function getERC20(address: string, chainId: number = 1, signerOrProvider?: ethers.ContractRunner) {
  return new ethers.Contract(address, ERC20_ABI, signerOrProvider || getProvider(chainId))
}

export function getUniswapV2Pair(pairAddress: string, chainId: number = 1) {
  return new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, getProvider(chainId))
}

export function getUniswapV2Factory(chainId: number = 1) {
  const addr = CONTRACT_ADDRESSES[chainId as 1 | 8453]?.uniswapV2Factory
  return new ethers.Contract(addr, UNISWAP_V2_FACTORY_ABI, getProvider(chainId))
}
