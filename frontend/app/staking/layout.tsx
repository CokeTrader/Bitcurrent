import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crypto Staking UK | Earn Up to 20% APY on ETH & Crypto - BitCurrent',
  description: 'Earn passive income on Ethereum, Solana, Cardano & more. Up to 20% APY. Flexible & locked staking. Secure DeFi staking platform for UK investors.',
  keywords: ['crypto staking uk', 'ethereum staking', 'defi staking', 'staking rewards', 'passive income crypto', 'eth staking uk', 'cardano staking'],
  openGraph: {
    title: 'Crypto Staking UK | Earn Passive Income on Your Crypto',
    description: 'Stake Ethereum, Solana, Cardano and earn up to 20% APY. Flexible and locked staking options available.',
    url: 'https://bitcurrent.co.uk/staking',
  },
  alternates: {
    canonical: 'https://bitcurrent.co.uk/staking',
  },
}

export default function StakingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

