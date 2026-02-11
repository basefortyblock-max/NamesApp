"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface WalletState {
  isConnected: boolean
  address: string | null
  basename: string | null
  balance: number
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletState | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [basename, setBasename] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)

  const connect = useCallback(async () => {
    try {
      // Check if window.ethereum exists
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        
        if (accounts && accounts.length > 0) {
          const addr = accounts[0]
          setAddress(addr)
          setBasename(`${addr.slice(0, 6)}...${addr.slice(-4)}.base.eth`)
          setBalance(0) // Fetch real balance via provider
          setIsConnected(true)
        }
      } else {
        // Fallback: Open Coinbase Wallet or show error
        alert("Please install a wallet extension or use Coinbase Wallet")
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
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