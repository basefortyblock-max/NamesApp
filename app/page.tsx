"use client"

import { useWallet } from "@/lib/wallet-context"
import { useStories } from "@/lib/stories-context"
import { StoryCard } from "@/components/story-card"
import { BalanceCard } from "@/components/balance-card"
import { Wallet, Sparkles } from "lucide-react"

export default function HomePage() {
  const { isConnected, connect } = useWallet()
  const { stories } = useStories()

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero / Connect prompt when not connected */}
      {!isConnected && (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            The Philosophy Behind Your Username
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            Share why you chose your name. Earn USDC when others value your story. Connect your wallet to get started.
          </p>
          <button
            onClick={connect}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        </div>
      )}

      {/* Balance card */}
      <BalanceCard />

      {/* Feed header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-base font-semibold text-foreground">Stories</h2>
        <span className="text-xs text-muted-foreground">{stories.length} stories</span>
      </div>

      {/* Story feed */}
      <div className="flex flex-col">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {stories.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">No stories yet. Be the first to share yours.</p>
        </div>
      )}
    </div>
  )
}
