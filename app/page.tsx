"use client"

/**
 * Feed view — top stories by tipsTotal.
 * Simplified version of original app/page.tsx (Phase 3 cleanup).
 *
 * REPLACES:
 * - "Send Appreciation" paymaster flow → plain USDC Transfer (user pays gas, ~$0.001 ETH)
 * - onchainkit Transaction capabilities.paymasterService removed
 * - 5% price-increment model removed → just tip counter + tipsTotal
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { WalletConnect } from "@/components/connect-wallet-button"
import { Sparkles, Heart } from "lucide-react"
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from "@coinbase/onchainkit/transaction"
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction"
import { base } from "viem/chains"
import { encodeFunctionData, erc20Abi } from "viem"

interface Story {
  id: string
  username: string
  platform: string
  philosophy: string
  tipsCount: number
  tipsTotal: number
  lastTipAt: string | null
  createdAt: string
  address: string
}

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const
const SUGGESTED_TIPS = ["0.10", "0.50", "1.00", "5.00"]

export default function FeedPage() {
  const { address } = useAccount()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [tippingStory, setTippingStory] = useState<Story | null>(null)
  const [tipAmount, setTipAmount] = useState("0.10")

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    try {
      const res = await fetch("/api/stories?sort=tips")
      const data = await res.json()
      setStories(data.stories || [])
    } catch (e) {
      console.error("fetch stories:", e)
    } finally {
      setLoading(false)
    }
  }

  function openTip(s: Story) {
    if (!address) return alert("Connect wallet to tip")
    setTippingStory(s)
    setTipAmount("0.10")
  }

  async function handleTipSuccess(status: LifecycleStatus) {
    if (status.statusName !== "success" || !tippingStory) return
    const data = status.statusData as any
    const txHash: string | null =
      data?.transactionReceipts?.[0]?.transactionHash ??
      data?.receipts?.[0]?.transactionHash ??
      data?.transactionHash ??
      null
    const amount = parseFloat(tipAmount)

    // Optimistic UI update
    setStories((prev) =>
      prev.map((s) =>
        s.id === tippingStory.id
          ? {
              ...s,
              tipsCount: s.tipsCount + 1,
              tipsTotal: s.tipsTotal + amount,
              lastTipAt: new Date().toISOString(),
            }
          : s
      )
    )
    setTippingStory(null)
    setTipAmount("0.10")

    // DB write in background — non-blocking
    fetch(`/api/stories/${tippingStory.id}/tip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: address, amount, txHash }),
    }).catch((err) =>
      console.error("tip DB save failed (tx already confirmed):", err)
    )
  }

  function buildTipCall(recipient: string, usdAmount: number) {
    const wei = BigInt(Math.floor(usdAmount * 1e6))
    return {
      to: USDC_ADDRESS,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient as `0x${string}`, wei],
      }),
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const recipient = tippingStory?.address as `0x${string}` | undefined
  const amt = parseFloat(tipAmount)
  const isValid = !isNaN(amt) && amt >= 0.10 && recipient
  const tipCalls = isValid ? [buildTipCall(recipient!, amt)] : []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Username Philosophies
        </h1>
        <p className="text-base text-muted-foreground">
          Tip the stories that resonate
        </p>
      </div>

      {!address && (
        <div className="mb-8 rounded-xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary mb-3" />
          <h2 className="text-lg font-bold mb-2">Connect Wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect to publish your story or tip creators
          </p>
          <div className="inline-flex">
            <WalletConnect />
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Top Stories
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({stories.length})
          </span>
        </h2>
        {address && (
          <button
            onClick={() => router.push("/write")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Publish Your Story
          </button>
        )}
      </div>

      {stories.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-lg font-bold mb-2">No Stories Yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Be the first to publish.
          </p>
          {address && (
            <button
              onClick={() => router.push("/write")}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Publish Your Story
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <article
              key={story.id}
              onClick={() => router.push(`/u/${story.username}`)}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-base font-bold text-primary">
                    {story.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate">
                    @{story.username}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{story.platform}</span>
                    <span>•</span>
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {story.tipsCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${story.tipsTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-foreground line-clamp-3 whitespace-pre-wrap mb-4">
                {story.philosophy}
              </p>

              {address && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openTip(story)
                  }}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20"
                >
                  Tip Creator
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {tippingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card border-2 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Tip <span className="text-primary">@{tippingStory.username}</span>
              </h3>
              <button onClick={() => setTippingStory(null)} className="text-muted-foreground">
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {tippingStory.philosophy}
            </p>

            <label className="block text-sm font-medium mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.10"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-mono outline-none focus:border-primary"
              placeholder="0.10"
            />

            <div className="mt-3 flex gap-2">
              {SUGGESTED_TIPS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTipAmount(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    tipAmount === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  ${s}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Min $0.10 • Direct USDC transfer on Base • You pay a tiny gas fee
            </p>

            {isValid ? (
              <div className="mt-4">
                <Transaction
                  chainId={base.id}
                  calls={tipCalls}
                  onStatus={handleTipSuccess}
                >
                  <TransactionButton
                    text={`Tip $${tipAmount} USDC`}
                    className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                  />
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
              </div>
            ) : (
              <button
                disabled
                className="mt-4 w-full rounded-lg bg-primary/50 py-3 text-base font-semibold text-primary-foreground cursor-not-allowed"
              >
                Minimum $0.10 USDC
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}