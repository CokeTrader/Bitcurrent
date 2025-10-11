import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'BitCurrent Exchange',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    ...(process.env.NODE_ENV === 'development' ? [sepolia] : []),
  ],
  ssr: true,
});

// Supported chains configuration
export const supportedChains = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    icon: '⟠',
    color: '#627EEA',
    explorer: 'https://etherscan.io',
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    icon: '⬢',
    color: '#8247E5',
    explorer: 'https://polygonscan.com',
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    icon: '🔴',
    color: '#FF0420',
    explorer: 'https://optimistic.etherscan.io',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    icon: '🔷',
    color: '#28A0F0',
    explorer: 'https://arbiscan.io',
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    icon: '🔵',
    color: '#0052FF',
    explorer: 'https://basescan.org',
  },
];

// Get chain info by ID
export function getChainInfo(chainId: number) {
  return supportedChains.find(chain => chain.id === chainId) || supportedChains[0];
}

// Token configurations for different chains
export const tokenConfig = {
  // Ethereum Mainnet
  1: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
  // Polygon
  137: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  },
};

// Gas estimation presets
export const gasPresets = {
  slow: { multiplier: 1.0, label: 'Slow', time: '~5 min' },
  standard: { multiplier: 1.2, label: 'Standard', time: '~2 min' },
  fast: { multiplier: 1.5, label: 'Fast', time: '~30 sec' },
};






