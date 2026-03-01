"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, X } from "lucide-react"

interface Comment {
  id: string
  author: string
  address: string
  text: string
  createdAt: string
}

interface StoryCommentsProps {
  storyId: string
  address: string | undefined
}

export default function StoryComments({ storyId, address }: StoryCommentsProps) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments])

  async function fetchComments() {
    try {
      setLoading(true)
      const response = await fetch(`/api/stories/${storyId}/comment`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComment() {
    if (!address) {
      alert('Please connect wallet to comment')
      return
    }

    if (!newComment.trim()) {
      alert('Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/stories/${storyId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          text: newComment,
          author: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post comment')
      }

      const data = await response.json()
      setComments([data.comment, ...comments])
      setNewComment("")
    } catch (error: any) {
      alert(`❌ ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border-t border-border pt-4">
      {/* Toggle Comments Button */}
      {!showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comments ({comments.length})</span>
        </button>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">
              Comments ({comments.length})
            </h4>
            <button
              onClick={() => setShowComments(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Comment Input */}
          {address ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
                placeholder="Add a comment..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
              Connect wallet to comment
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg bg-secondary/50 p-3"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm text-foreground">
                      {comment.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
