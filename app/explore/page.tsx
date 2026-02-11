"use client"

import { useState } from "react"
import { Search, UserPlus, UserCheck, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWallet } from "@/lib/wallet-context"
import { useStories } from "@/lib/stories-context"
import { StoryCard } from "@/components/story-card"

interface ExploreUser {
  username: string
  basename: string
  platform: string
  stories: number
  followers: number
  totalValue: number
  isFollowing: boolean
}

const EXPLORE_USERS: ExploreUser[] = [
  { username: "SatoshiDreamer", basename: "satoshi.base.eth", platform: "Base", stories: 3, followers: 245, totalValue: 42.50, isFollowing: false },
  { username: "LunaMoonrise", basename: "luna.base.eth", platform: "Twitter", stories: 5, followers: 512, totalValue: 89.25, isFollowing: false },
  { username: "PhoenixEth", basename: "phoenix.base.eth", platform: "Base", stories: 2, followers: 178, totalValue: 120.00, isFollowing: false },
  { username: "ZenBuilder", basename: "zen.base.eth", platform: "Instagram", stories: 7, followers: 334, totalValue: 55.75, isFollowing: false },
  { username: "CryptoNomad", basename: "nomad.base.eth", platform: "TikTok", stories: 4, followers: 892, totalValue: 210.30, isFollowing: false },
  { username: "PixelArtisan", basename: "pixel.base.eth", platform: "Twitter", stories: 6, followers: 456, totalValue: 67.80, isFollowing: false },
]

const PLATFORM_FILTERS = ["All", "Base", "Twitter", "Instagram", "TikTok", "Facebook"]

export default function ExplorePage() {
  const { isConnected } = useWallet()
  const { stories } = useStories()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("All")
  const [users, setUsers] = useState(EXPLORE_USERS)
  const [activeTab, setActiveTab] = useState<"users" | "trending">("users")

  const toggleFollow = (username: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username ? { ...u, isFollowing: !u.isFollowing } : u
      )
    )
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.basename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform =
      selectedPlatform === "All" || u.platform === selectedPlatform
    return matchesSearch && matchesPlatform
  })

  const trendingStories = [...stories].sort((a, b) => b.price - a.price)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Explore</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover names and the stories behind them.
        </p>
      </div>

      {/* Search bar */}
      <div className="px-4">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search usernames or basenames..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-border px-4">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex-1 border-b-2 pb-2.5 text-sm font-medium transition-colors",
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("trending")}
          className={cn(
            "flex-1 border-b-2 pb-2.5 text-sm font-medium transition-colors",
            activeTab === "trending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center justify-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Trending
          </span>
        </button>
      </div>

      {activeTab === "users" && (
        <>
          {/* Platform filters */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            {PLATFORM_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedPlatform === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Users list */}
          <div className="flex flex-col">
            {filteredUsers.map((user) => (
              <div
                key={user.username}
                className="flex items-center justify-between border-b border-border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <span className="text-sm font-bold text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{user.username}</span>
                      <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {user.platform}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{user.basename}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{user.stories} stories</span>
                      <span>{user.followers} followers</span>
                      <span className="text-primary font-medium">${user.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {isConnected && (
                  <button
                    onClick={() => toggleFollow(user.username)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      user.isFollowing
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {user.isFollowing ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">No users found matching your search.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "trending" && (
        <div className="flex flex-col">
          {trendingStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  )
}
