import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Names App',
      preference: 'smartWalletOnly',
    }),
  ],
  ssr: true,
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
})