import { type Address } from 'viem'
import { type Abi } from 'viem'

// Contract ABIs (simplified for demo - would be full ABIs in production)
export const STAKING_CONTRACT_ABI = [
  {
    name: 'stake',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unstake',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimRewards',
    type: 'function',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getStakedAmount',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPendingRewards',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getAPY',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

// Contract addresses per chain
export const STAKING_CONTRACTS: Record<number, Address> = {
  1: '0x0000000000000000000000000000000000000000', // Ethereum Mainnet
  137: '0x0000000000000000000000000000000000000000', // Polygon
  10: '0x0000000000000000000000000000000000000000', // Optimism
  42161: '0x0000000000000000000000000000000000000000', // Arbitrum
  8453: '0x0000000000000000000000000000000000000000', // Base
}

// Staking pool configurations
export interface StakingPool {
  id: string
  name: string
  symbol: string
  asset: string
  apy: number
  tvl: number
  minStake: number
  lockPeriod: number // in days
  autoCompound: boolean
  contractAddress?: Address
  chainId: number
}

export const STAKING_POOLS: StakingPool[] = [
  {
    id: 'eth-staking',
    name: 'Ethereum Staking',
    symbol: 'ETH',
    asset: 'Ethereum',
    apy: 5.2,
    tvl: 12500000,
    minStake: 0.1,
    lockPeriod: 0, // Flexible
    autoCompound: true,
    chainId: 1,
  },
  {
    id: 'sol-staking',
    name: 'Solana Staking',
    symbol: 'SOL',
    asset: 'Solana',
    apy: 7.8,
    tvl: 8200000,
    minStake: 1,
    lockPeriod: 0,
    autoCompound: true,
    chainId: 1, // Would be Solana chain in production
  },
  {
    id: 'ada-staking',
    name: 'Cardano Staking',
    symbol: 'ADA',
    asset: 'Cardano',
    apy: 4.5,
    tvl: 5600000,
    minStake: 100,
    lockPeriod: 0,
    autoCompound: false,
    chainId: 1,
  },
  {
    id: 'matic-staking',
    name: 'Polygon Staking',
    symbol: 'MATIC',
    asset: 'Polygon',
    apy: 6.2,
    tvl: 3400000,
    minStake: 10,
    lockPeriod: 7,
    autoCompound: true,
    chainId: 137,
  },
]

// Calculate rewards based on staking amount and time
export function calculateRewards(
  stakedAmount: number,
  apy: number,
  daysStaked: number
): number {
  const dailyRate = apy / 365 / 100
  return stakedAmount * dailyRate * daysStaked
}

// Calculate projected earnings
export function calculateProjectedEarnings(
  amount: number,
  apy: number,
  days: number
): {
  daily: number
  weekly: number
  monthly: number
  yearly: number
  total: number
} {
  const daily = calculateRewards(amount, apy, 1)
  const weekly = calculateRewards(amount, apy, 7)
  const monthly = calculateRewards(amount, apy, 30)
  const yearly = calculateRewards(amount, apy, 365)
  const total = calculateRewards(amount, apy, days)

  return { daily, weekly, monthly, yearly, total }
}

// Get pool by ID
export function getPoolById(id: string): StakingPool | undefined {
  return STAKING_POOLS.find(pool => pool.id === id)
}

// Get pools by chain
export function getPoolsByChain(chainId: number): StakingPool[] {
  return STAKING_POOLS.filter(pool => pool.chainId === chainId)
}

// Mock function to get staked amount (would read from blockchain in production)
export async function getStakedAmount(
  poolId: string,
  address: Address
): Promise<number> {
  // In production, this would call the smart contract
  // For now, return demo data
  const demoStakes: Record<string, number> = {
    'eth-staking': 2.5,
    'sol-staking': 50.2,
    'ada-staking': 0,
    'matic-staking': 0,
  }
  return demoStakes[poolId] || 0
}

// Mock function to get pending rewards (would read from blockchain in production)
export async function getPendingRewards(
  poolId: string,
  address: Address
): Promise<number> {
  const pool = getPoolById(poolId)
  if (!pool) return 0
  
  const stakedAmount = await getStakedAmount(poolId, address)
  const daysStaked = 30 // Mock: 30 days staked
  
  return calculateRewards(stakedAmount, pool.apy, daysStaked)
}

// Get total portfolio value
export async function getTotalStakedValue(
  address: Address
): Promise<{ total: number; rewards: number }> {
  let total = 0
  let rewards = 0

  for (const pool of STAKING_POOLS) {
    const staked = await getStakedAmount(pool.id, address)
    const pending = await getPendingRewards(pool.id, address)
    
    total += staked
    rewards += pending
  }

  return { total, rewards }
}

