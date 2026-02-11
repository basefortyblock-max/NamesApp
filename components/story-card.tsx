"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, DollarSign, Send, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStories, type Story } from "@/lib/stories-context"
import { useWallet } from "@/lib/wallet-context"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function getPlatformColor(platform: string) {
  switch (platform.toLowerCase()) {
    case "base":
      return "bg-primary/15 text-primary"
    case "twitter":
      return "bg-foreground/10 text-foreground"
    case "instagram":
      return "bg-pink-100 text-pink-700"
    case "tiktok":
      return "bg-foreground/10 text-foreground"
    case "facebook":
      return "bg-blue-100 text-blue-700"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function StoryCard({ story }: { story: Story }) {
  const { toggleLike, addComment, valueStory } = useStories()
  const { isConnected, basename } = useWallet()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showValueInput, setShowValueInput] = useState(false)
  const [valueAmount, setValueAmount] = useState("0.01")

  const handleComment = () => {
    if (!commentText.trim() || !isConnected) return
    addComment(story.id, {
      author: basename?.split(".")[0] || "Anonymous",
      basename: basename || "anon.base.eth",
      text: commentText,
    })
    setCommentText("")
  }

  const handleValue = () => {
    const amount = Number.parseFloat(valueAmount)
    if (Number.isNaN(amount) || amount < 0.01) return
    valueStory(story.id, amount)
    setShowValueInput(false)
    setValueAmount("0.01")
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${story.username}'s Name Philosophy`,
        text: story.story.slice(0, 100) + "...",
        url: window.location.href,
      })
    }
  }

  return (
    <article className="border-b border-border bg-card">
      <div className="px-4 py-4">
        {/* Author header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <span className="text-sm font-bold text-primary">
                {story.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{story.username}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", getPlatformColor(story.platform))}>
                  {story.platform}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{story.basename} · {timeAgo(story.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{story.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Story content */}
        <p className="mt-3 text-sm leading-relaxed text-foreground">{story.story}</p>

        {/* Action bar */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => isConnected && toggleLike(story.id)}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              story.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
            disabled={!isConnected}
          >
            <Heart className={cn("h-4 w-4", story.liked && "fill-current")} />
            <span>{story.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{story.comments.length}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
            <span>{story.shares}</span>
          </button>

          <button
            onClick={() => isConnected && setShowValueInput(!showValueInput)}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            disabled={!isConnected}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Value
          </button>
        </div>

        {/* Value input */}
        {showValueInput && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
            <span className="text-xs font-medium text-muted-foreground">USDC</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="0.01"
            />
            <button
              onClick={handleValue}
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Send
            </button>
          </div>
        )}

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 border-t border-border pt-3">
            {story.comments.length > 0 && (
              <div className="flex flex-col gap-3">
                {story.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <span className="text-[10px] font-bold text-secondary-foreground">
                        {c.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs">
                        <span className="font-semibold text-foreground">{c.author}</span>{" "}
                        <span className="text-muted-foreground">{c.text}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</p>
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
                  className="flex-1 rounded-full border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
