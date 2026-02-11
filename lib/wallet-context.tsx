"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface WalletState {
  isConnected: boolean
  address: string | null
  basename: string | null
  balance: number
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletState | null>(null)

const MOCK_ADDRESSES = [
  "0x1a2B...9cDe",
  "0x3f4A...7bCd",
  "0x5e6D...2aFb",
]

const MOCK_BASENAMES = [
  "aurora.base.eth",
  "cosmic.base.eth",
  "phoenix.base.eth",
]

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [basename, setBasename] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)

  const connect = useCallback(() => {
    const idx = Math.floor(Math.random() * MOCK_ADDRESSES.length)
    setAddress(MOCK_ADDRESSES[idx])
    setBasename(MOCK_BASENAMES[idx])
    setBalance(12.45)
    setIsConnected(true)
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setBasename(null)
    setBalance(0)
    setIsConnected(false)
  }, [])

  return (
    <WalletContext.Provider value={{ isConnected, address, basename, balance, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}
