"use client"

import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { OnchainKitProvider } from "@coinbase/onchainkit"
import { base } from "wagmi/chains"
import { wagmiConfig } from "@/lib/wagmi"

// Suppress analytics errors in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  console.error = (...args) => {
    const errorStr = args[0]?.toString?.() || ''
    if (
      errorStr.includes('Analytics SDK') ||
      errorStr.includes('Failed to fetch') ||
      errorStr.includes('coinbase.com') ||
      args[0]?.message?.includes('fetch')
    ) {
      return // Suppress
    }
    originalError.apply(console, args)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}