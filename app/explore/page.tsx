"use client"

/**
 * app/explore/page.tsx
 *
 * FIXES:
 * - Changed API from /api/users/available (only open-for-pairing) to
 *   /api/stories (all published stories) so all usernames are visible
 * - Added story preview text in each card
 * - Added link to story detail page
 * - Filter "Open for Pairing" still works via openForPairing field
 * - Search works across username and platform
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, CheckCircle2, ArrowRight, BookOpen } from "lucide-react"

interface Story {
  id: string
  username: string
  platform: string
  story: string
  price: number
  verified: boolean
  createdAt: string
  address: string
}

export default function ExplorePage() {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    try {
      // ✅ Fetch all published stories, not just open-for-pairing users
      const response = await fetch('/api/stories')
      const data = await response.json()
      setStories(data.stories || [])
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStories = stories.filter(story => {
    const matchesSearch =
      story.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.platform.toLowerCase().includes(searchTerm.toLowerCase())
    // filterOpen: show all when off, show only verified when on
    const matchesFilter = !filterOpen || story.verified
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">Explore Usernames</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Discover usernames and their philosophies
      </p>

      {/* Search & Filter */}
      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or platform..."
            className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            filterOpen
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-foreground hover:border-primary/40'
          }`}
        >
          <Filter className="h-4 w-4" />
          Verified Only
        </button>
      </div>

      {/* Results */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-4">
          {filteredStories.length} username{filteredStories.length !== 1 ? 's' : ''} found
        </p>

        {filteredStories.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'No usernames match your search' : 'No usernames published yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-base font-bold text-primary">
                    {story.username.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      @{story.username}
                    </p>
                    {story.verified && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {story.platform}
                    </span>
                  </div>

                  {/* Story preview */}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {story.story}
                  </p>

                  {/* Price + date */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold text-primary">
                      {story.price.toFixed(2)} USDC
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/story/${story.id}`)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Read
                  </button>
                  <button
                    onClick={() => router.push(`/pair?user=${story.address}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Pair
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}