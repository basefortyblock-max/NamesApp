// lib/wagmi.ts
// Keep getDefaultConfig from RainbowKit — required for RainbowKitProvider compatibility
// farcasterFrame connector is handled separately in farcaster-ready.tsx
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'Names App',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base],
  ssr: true,
})