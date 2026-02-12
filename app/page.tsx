"use client"

import { useAccount } from "wagmi"
import { useStories } from "@/lib/stories-context"
import { StoryCard } from "@/components/story-card"
import { BalanceCard } from "@/components/balance-card"
import { Sparkles } from "lucide-react"
import { ConnectWallet } from "@coinbase/onchainkit/wallet"

export default function HomePage() {
  const { isConnected } = useAccount()
  const { stories } = useStories()

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero / Connect prompt when not connected */}
      {!isConnected && (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            The Charismatic Philosophy Behind Your Username
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-base leading-relaxed text-muted-foreground text-pretty">
            Share why you chose your name. Earn USDC when others value your story. Connect your wallet to get started.
          </p>
          <div className="mt-5 inline-flex">
            <ConnectWallet />
          </div>
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