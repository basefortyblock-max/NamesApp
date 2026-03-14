"use client"

/**
 * app/page.tsx
 *
 * FIXES:
 * - Story interface: added `address` field for USDC recipient
 * - handleSendValue() removed — replaced with OnchainKit <Transaction>
 *   so real onchain USDC transfer happens with gasless sponsorship
 * - handleTransactionSuccess() saves real txHash to DB after onchain confirmation
 * - DB save is non-blocking — error never shows alert popup to user
 * - Removed sendingValue state — OnchainKit manages loading state internally
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { WalletConnect } from "@/components/connect-wallet-button"
import { Sparkles, DollarSign, X } from "lucide-react"
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

interface Story {
  id: string
  username: string
  platform: string
  story: string
  price: number
  verified: boolean
  createdAt: string
  userId: string
  address: string // ✅ wallet address penerima USDC
}

export default function HomePage() {
  const { address } = useAccount()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  // Send Value Modal
  const [showValueModal, setShowValueModal] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [valueAmount, setValueAmount] = useState("0.7")

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    try {
      const response = await fetch('/api/stories')
      const data = await response.json()
      setStories(data.stories || [])
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setLoading(false)
    }
  }

  function openValueModal(story: Story) {
    if (!address) {
      alert('Please connect wallet to send appreciation')
      return
    }
    setSelectedStory(story)
    setValueAmount("0.7")
    setShowValueModal(true)
  }

  // ✅ Called by OnchainKit after tx confirmed onchain — save to DB non-blocking
  const handleTransactionSuccess = async (status: LifecycleStatus) => {
    if (status.statusName !== "success" || !selectedStory) return

    const data = status.statusData as any
    const txHash: string | null =
      data?.transactionReceipts?.[0]?.transactionHash ??
      data?.receipts?.[0]?.transactionHash ??
      data?.receipt?.transactionHash ??
      data?.transactionHash ??
      null

    const amount = parseFloat(valueAmount)

    // Update local price immediately
    setStories((prev) =>
      prev.map((s) =>
        s.id === selectedStory.id
          ? { ...s, price: s.price + amount * 0.05 }
          : s
      )
    )

    setShowValueModal(false)
    setValueAmount("0.7")

    // Save to DB in background — non-blocking, no alert on failure
    fetch(`/api/stories/${selectedStory.id}/value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: address,
        to: selectedStory.address,
        amount,
        txHash,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('DB save failed (tx already confirmed onchain):', err)
        }
      })
      .catch((err) =>
        console.error('DB save network error (tx already confirmed):', err)
      )
  }

  // Build OnchainKit calls for selected story
  const amount = parseFloat(valueAmount)
  const isValidAmount = !isNaN(amount) && amount >= 0.7
  const recipientAddress = selectedStory?.address as `0x${string}` | undefined

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Username Philosophy
        </h1>
        <p className="text-base text-muted-foreground">
          Discover the charismatic stories behind usernames
        </p>
      </div>

      {/* CTA if no wallet */}
      {!address && (
        <div className="mb-8 rounded-xl border-2 border-primary/30 bg-primary/5 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            Share Your Story
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your wallet to share the philosophy behind your username
          </p>
          <div className="inline-flex"><WalletConnect /></div>
        </div>
      )}

      {/* Stories Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Latest Stories
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({stories.length})
          </span>
        </h2>
        {address && (
          <button
            onClick={() => router.push('/write')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Write Your Story
          </button>
        )}
      </div>

      {/* Stories List */}
      {stories.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No Stories Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Be the first to share your username philosophy!
          </p>
          {address ? (
            <button
              onClick={() => router.push('/write')}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" />
              Write Your Story
            </button>
          ) : (
            <div className="inline-flex"><WalletConnect /></div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {stories.map((story) => (
            <article
              key={story.id}
              className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
            >
              {/* Story Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">
                    {story.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-foreground">
                      @{story.username}
                    </p>
                    {story.verified && (
                      <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    {story.price.toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-muted-foreground">Base price</p>
                </div>
              </div>

              {/* Story Content */}
              <p className="text-base leading-relaxed text-foreground mb-4 whitespace-pre-wrap">
                {story.story}
              </p>

              {/* Send Appreciation Button */}
              {address && (
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => openValueModal(story)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <DollarSign className="h-4 w-4" />
                    Send Appreciation
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Send Value Modal */}
      {showValueModal && selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card border-2 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Send Appreciation
              </h3>
              <button
                onClick={() => setShowValueModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-1">To</p>
              <p className="text-base font-semibold text-foreground">
                @{selectedStory.username}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.7"
                value={valueAmount}
                onChange={(e) => setValueAmount(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="0.7"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum: 0.7 USDC • No maximum
              </p>
            </div>

            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 mb-4">
               <p className="text-xs text-green-700 dark:text-green-300 font-medium">
               ⚡ No gas fees — transaction sponsored by Paymaster
               </p>
               <p className="text-xs text-green-600/70 dark:text-green-400/60 mt-1">
               💡 Use Coinbase Wallet for true gasless
               </p>
            </div>

            {/* ✅ OnchainKit Transaction — real gasless USDC transfer */}
            {isValidAmount && calls.length > 0 ? (
              <Transaction
                chainId={base.id}
                calls={calls}
                capabilities={{
                  paymasterService: {
                    url: "/api/paymaster/proxy",
                  },
                }}
                onStatus={handleTransactionSuccess}
              >
                <TransactionButton
                  text={`Send ${valueAmount} USDC`}
                  className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                />
                <TransactionStatus>
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
              </Transaction>
            ) : (
              <button
                disabled
                className="w-full rounded-lg bg-primary/50 py-3 text-base font-semibold text-primary-foreground cursor-not-allowed"
              >
                Minimum 0.7 USDC
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}