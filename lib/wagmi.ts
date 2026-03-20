// lib/wagmi.ts
import { createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterFrame } from '@farcaster/frame-wagmi-connector'
import {
  coinbaseWallet,
  metaMask,
  walletConnect,
} from 'wagmi/connectors'

// ✅ Use createConfig instead of getDefaultConfig so we can add farcasterFrame connector
// getDefaultConfig from RainbowKit does not accept custom connectors
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    farcasterFrame(),              // auto-connects inside Farcaster Mini App
    coinbaseWallet({ appName: 'Names App' }),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    }),
  ],
  ssr: true,
})