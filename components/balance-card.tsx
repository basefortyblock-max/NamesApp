"use client"

import { useAccount } from "wagmi"
import { ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"
import { Avatar, Name, Address } from "@coinbase/onchainkit/identity"

export function BalanceCard() {
  const { isConnected, address } = useAccount()

  if (!isConnected || !address) return null

  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-primary p-4 text-primary-foreground">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-primary-foreground/70">Your Balance</p>
          <p className="mt-1 text-2xl font-bold">
            $0.00 <span className="text-sm font-normal text-primary-foreground/80">USDC</span>
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15">
          <Wallet className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 text-xs text-primary-foreground/60">
        {address.slice(0, 6)}...{address.slice(-4)}
      </p>
      <div className="mt-3 flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-primary-foreground/25">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Withdraw
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-primary-foreground/25">
          <ArrowDownLeft className="h-3.5 w-3.5" />
          Receive
        </button>
      </div>
    </div>
  )
}