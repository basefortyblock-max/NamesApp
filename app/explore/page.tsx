"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { WalletConnect } from "@/components/connect-wallet-button"
<WalletConnect />
import { Search, Filter, CheckCircle2, ArrowRight } from "lucide-react"

interface User {
  address: string
  username: string
  platform: string
  verified: boolean
  openForPairing: boolean
  createdAt: string
}

export default function ExplorePage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users/available')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterOpen || user.openForPairing
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
        Discover usernames available for pairing
      </p>

      {/* Search & Filter */}
      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search usernames..."
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
          Open for Pairing
        </button>
      </div>

      {/* Results */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-4">
          {filteredUsers.length} username{filteredUsers.length !== 1 ? 's' : ''} found
        </p>

        {filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">No usernames found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredUsers.map((user) => (
              <div
                key={user.address}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-base font-bold text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">@{user.username}</p>
                    {user.verified && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{user.platform}</span>
                    {user.openForPairing && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-medium">Open for Pairing</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/pair?user=${user.address}`)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Pair
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}