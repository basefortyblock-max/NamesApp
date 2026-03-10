"use client"

import { WalletConnect } from "@/components/connect-wallet-button"


export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Names</span>
        </div>

        <WalletConnect />
      </div>
    </header>
  )
}
