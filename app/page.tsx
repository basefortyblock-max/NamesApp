"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { ConnectWallet } from "@coinbase/onchainkit/wallet"
import { Sparkles, Heart, Share2, X } from "lucide-react"
import StoryComments from "@/components/story-comments"

interface Story {
  id: string
  username: string
  platform: string
  story: string
  price: number
  likes: number
  shares: number
  verified: boolean
  createdAt: string
  userId: string
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
  const [sendingValue, setSendingValue] = useState(false)

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

  async function handleLike(storyId: string) {
    if (!address) {
      alert('Please connect wallet to like stories')
      return
    }

    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to like')
      }

      const data = await response.json()
      setStories(stories.map(s => 
        s.id === storyId ? { ...s, likes: data.likes } : s
      ))
    } catch (error: any) {
      alert(`❌ ${error.message}`)
    }
  }

  function handleShare(story: Story) {
    const text = `Check out @${story.username}'s story on Names App!`
    const url = `${window.location.origin}/?story=${story.id}`
    
    if (navigator.share) {
      navigator.share({ title: `@${story.username}'s Story`, text, url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  function openValueModal(story: Story) {
    if (!address) {
      alert('Please connect wallet to send value')
      return
    }
    setSelectedStory(story)
    setShowValueModal(true)
  }

  async function handleSendValue() {
    if (!selectedStory || !address) return
    
    const amount = parseFloat(valueAmount)
    if (isNaN(amount) || amount < 0.7) {
      alert('Minimum 0.7 USDC')
      return
    }

    setSendingValue(true)
    
    try {
      const response = await fetch(`/api/stories/${selectedStory.id}/value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          amount,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send value')
      }

      alert(`✅ Sent ${amount} USDC to @${selectedStory.username}!`)
      setShowValueModal(false)
      setValueAmount("0.7")
    } catch (error: any) {
      alert(`❌ ${error.message}`)
    } finally {
      setSendingValue(false)
    }
  }

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
          <ConnectWallet className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90" />
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
          <h3 className="text-lg font-bold text-foreground mb-2">
            No Stories Yet
          </h3>
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
            <ConnectWallet className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90" />
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
                    <span>{story.platform}</span>
                    <span>•</span>
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    {story.price.toFixed(2)} USDC
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Starting price
                  </p>
                </div>
              </div>

              {/* Story Content */}
              <p className="text-base leading-relaxed text-foreground mb-4 whitespace-pre-wrap">
                {story.story}
              </p>

              {/* Story Actions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <button 
                    onClick={() => handleLike(story.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{story.likes || 0}</span>
                  </button>
                  
                  <button 
                    onClick={() => handleShare(story)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  
                  {address && (
                    <button 
                      onClick={() => openValueModal(story)}
                      className="ml-auto rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Send Value
                    </button>
                  )}
                </div>

                {/* Comments Component */}
                <StoryComments storyId={story.id} address={address} />
              </div>
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
                Send Value to @{selectedStory.username}
              </h3>
              <button 
                onClick={() => setShowValueModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
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
                Minimum: 0.7 USDC
              </p>
            </div>

            <div className="rounded-lg bg-secondary/50 p-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground">{valueAmount} USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium text-foreground">@{selectedStory.username}</span>
              </div>
            </div>

            <button
              onClick={handleSendValue}
              disabled={sendingValue || parseFloat(valueAmount) < 0.7}
              className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingValue ? 'Sending...' : 'Send Value'}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              💸 This will send USDC from your wallet
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
