"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAccount, useDisconnect } from "wagmi"

interface WalletState {
  isConnected: boolean
  address: string | null
  disconnect: () => void
}

const WalletContext = createContext<WalletState | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address: address ?? null,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}