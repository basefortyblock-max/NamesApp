"use client"

/**
 * Profile view — single username story + tip CTA + recent tips list.
 * Replaces old app/story/[id]/page.tsx (deleted).
 */

import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Heart, ArrowLeft, Sparkles } from "lucide-react"
import { WalletConnect } from "@/components/connect-wallet-button"

interface Story {
  id: string
  username: string
  platform: string
  philosophy: string
  tipsCount: number
  tipsTotal: number
  address: string
  createdAt: string
  lastTipAt: string | null
}

interface Tip {
  from: string
  amount: number
  txHash: string
  createdAt: string
}

export function ProfileView({ story, recentTips }: { story: Story; recentTips: Tip[] }) {
  const router = useRouter()
  const { isConnected } = useAccount()

  const baseScan = (tx: string) => `https://basescan.org/tx/${tx}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Feed
      </button>

      <article className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
            <span className="text-2xl font-bold text-primary">
              {story.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">@{story.username}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {story.platform}
              </span>
              <span>•</span>
              <span>{new Date(story.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary flex items-center gap-1 justify-end">
              <Heart className="h-5 w-5" />
              {story.tipsCount}
            </p>
            <p className="text-xs text-muted-foreground">
              ${story.tipsTotal.toFixed(2)} USDC
            </p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-base leading-relaxed text-foreground mb-6">
          {story.philosophy}
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between">
          <div>
            {isConnected ? (
              <button
                onClick={() => router.push(`/?tip=${story.id}`)}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Tip @{story.username}
              </button>
            ) : (
              <div className="inline-flex">
                <WalletConnect />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {story.address.slice(0, 6)}...{story.address.slice(-4)}
          </p>
        </div>
      </article>

      {recentTips.length > 0 && (
        <section className="mt-6">
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Recent Tips
          </h3>
          <div className="space-y-2">
            {recentTips.map((t, i) => (
              <a
                key={i}
                href={baseScan(t.txHash)}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-mono">{t.from}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-base font-bold text-primary">
                  ${t.amount.toFixed(2)}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
