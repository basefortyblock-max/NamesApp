"use client"

/**
 * story-card.tsx
 *
 * CHANGES:
 * - Replaced handleValue() + valueStory() local-state-only call with
 *   OnchainKit <Transaction> component for real onchain USDC transfer
 * - Added paymasterService proxy so CDP API key stays server-side only
 * - handleTransactionSuccess() now POSTs real txHash to /api/stories/[id]/value
 *   after onchain confirmation, replacing the previous "pending-{Date.now()}" placeholder
 * - calls[] built from story.address (recipient) + buildUSDCTransferData from lib/paymaster
 * - valueStory() in context still called after success to sync local UI state
 */

import { useState } from "react"
import { Heart, MessageCircle, Share2, DollarSign, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStories, type Story } from "@/lib/stories-context"
import { useAccount } from "wagmi"
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from "@coinbase/onchainkit/transaction"
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction"
import { base } from "viem/chains"
import { buildUSDCTransferData, USDC_ADDRESS } from "@/lib/paymaster"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function StoryCard({ story }: { story: Story }) {
  const { toggleLike, addComment, valueStory } = useStories()
  const { isConnected, address } = useAccount()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showValueInput, setShowValueInput] = useState(false)
  const [valueAmount, setValueAmount] = useState("0.7")

  const displayName = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Anonymous"

  // Build OnchainKit calls — recipient from story.address
  const amount = parseFloat(valueAmount)
  const isValidAmount = !isNaN(amount) && amount >= 0.7
  const recipientAddress = story.address as `0x${string}`

  const calls =
    isValidAmount && recipientAddress
      ? [
          {
            to: USDC_ADDRESS,
            data: buildUSDCTransferData(
              recipientAddress,
              BigInt(Math.floor(amount * 1e6))
            ),
          },
        ]
      : []

  // Called by OnchainKit after tx is confirmed onchain
  const handleTransactionSuccess = async (status: LifecycleStatus) => {
    if (status.statusName !== "success") return

    const txHash =
      status.statusData.transactionReceipts?.[0]?.transactionHash ?? null

    // Persist real txHash to DB and update story price
    await fetch(`/api/stories/${story.id}/value`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: address,
        to: recipientAddress,
        amount,
        txHash,
      }),
    })

    // Sync local UI state
    valueStory(story.id, amount, txHash ?? undefined)
    setShowValueInput(false)
    setValueAmount("0.7")
  }

  const handleComment = () => {
    if (!commentText.trim() || !isConnected) return
    addComment(story.id, {
      author: displayName,
      basename: address || "anon.base.eth",
      text: commentText,
    })
    setCommentText("")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Names Story",
        text: story.story.slice(0, 100) + "...",
        url: window.location.href,
      })
    }
  }

  return (
    <article className="border-b border-border bg-card">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted" />
            <div>
              <span className="text-base font-semibold text-muted-foreground">
                Coming Soon
              </span>
              <p className="text-xs text-muted-foreground">
                {timeAgo(story.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-base leading-relaxed text-foreground">
          {story.story}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => isConnected && toggleLike(story.id)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              story.liked
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-500"
            )}
            disabled={!isConnected}
          >
            <Heart className={cn("h-5 w-5", story.liked && "fill-current")} />
            <span>{story.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{story.comments.length}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <Share2 className="h-5 w-5" />
            <span>{story.shares}</span>
          </button>

          <button
            onClick={() => isConnected && setShowValueInput(!showValueInput)}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
            disabled={!isConnected}
          >
            <DollarSign className="h-4 w-4" />
            Value
          </button>
        </div>

        {showValueInput && (
          <div className="mt-3 rounded-lg border border-border bg-secondary/50 p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                USDC
              </span>
              <input
                type="number"
                step="0.1"
                min="0.7"
                value={valueAmount}
                onChange={(e) => setValueAmount(e.target.value)}
                className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="0.7"
              />
            </div>

            {isValidAmount && calls.length > 0 ? (
              <Transaction
                chainId={base.id}
                calls={calls}
                capabilities={{
                  paymasterService: {
                    // Proxy route keeps PAYMASTER_URL server-side only
                    url: "/api/paymaster/proxy",
                  },
                }}
                onStatus={handleTransactionSuccess}
              >
                <TransactionButton
                  text={`Send ${amount} USDC`}
                  className="w-full rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                />
                <TransactionStatus>
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
              </Transaction>
            ) : (
              <p className="text-xs text-red-500">Minimum 0.7 USDC</p>
            )}
          </div>
        )}

        {showComments && (
          <div className="mt-3 border-t border-border pt-3">
            {story.comments.length > 0 && (
              <div className="flex flex-col gap-3">
                {story.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <span className="text-xs font-bold text-secondary-foreground">
                        {c.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">
                          {c.author}
                        </span>{" "}
                        <span className="text-muted-foreground">{c.text}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {timeAgo(c.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isConnected && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-full border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}