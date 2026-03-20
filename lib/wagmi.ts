// lib/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base } from 'wagmi/chains'
import { farcasterFrame } from '@farcaster/frame-wagmi-connector'

export const wagmiConfig = getDefaultConfig({
  appName: 'Names App',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base],
  ssr: true,
  // ✅ farcasterFrame() connector:
  // - Inside Farcaster Mini App: auto-detects frame context, connects wallet silently
  // - In browser: ignored, RainbowKit shows MetaMask/Coinbase/WalletConnect as usual
  connectors: [farcasterFrame()],
})