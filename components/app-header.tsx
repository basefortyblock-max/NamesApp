"use client"

import { useWallet } from "@/lib/wallet-context"
import { Wallet, LogOut } from "lucide-react"

export function AppHeader() {
  const { isConnected, basename, balance, connect, disconnect } = useWallet()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Names</span>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{basename}</p>
              <p className="text-xs text-muted-foreground">${balance.toFixed(2)} USDC</p>
            </div>
            <button
              onClick={disconnect}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
              aria-label="Disconnect wallet"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Wallet className="h-4 w-4" />
            Connect
          </button>
        )}
      </div>
    </header>
  )
}
