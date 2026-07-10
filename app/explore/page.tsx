"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, CheckCircle2, BookOpen } from "lucide-react"

interface Story {
  id: string
  username: string
  platform: string
  tipsTotal: number
  tipsCount: number
  createdAt: string
  address: string
}

export default function ExplorePage() {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [platform, setPlatform] = useState<string>("all")

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    setLoading(true)
    try {
      const qs = platform !== "all" ? `?platform=${platform}` : ""
      const res = await fetch(`/api/stories${qs}`)
      const data = await res.json()
      setStories(data.stories || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStories()
  }, [platform])

  const filtered = stories.filter((s) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      s.username.toLowerCase().includes(q) ||
      s.platform.toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Explore</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse and search usernames across platforms.
      </p>

      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search username or platform..."
            className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2.5 text-sm"
        >
          <option value="all">All platforms</option>
          <option value="base">Base</option>
          <option value="farcaster">Farcaster</option>
          <option value="zora">Zora</option>
          <option value="twitter">Twitter (X)</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="facebook">Facebook</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mt-6">
        <p className="text-xs text-muted-foreground mb-3">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || platform !== "all"
                ? "No matches"
                : "No stories yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((story) => (
              <button
                key={story.id}
                onClick={() => router.push(`/u/${story.username}`)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-base font-bold text-primary">
                    {story.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold truncate">
                    @{story.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {story.platform} • {story.tipsCount} tips • ${story.tipsTotal.toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
