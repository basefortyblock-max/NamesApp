
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { ConnectWallet } from "@coinbase/onchainkit/wallet"
import { Sparkles, Plus, TrendingUp, Search, Edit2 } from "lucide-react"
import { TradingTerminal } from "@/components/trading-terminal"

interface Story {
  id: string
  username: string
  platform: string
  address: string
}

export default function PairPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()
  
  const [ownUsernames, setOwnUsernames] = useState<Story[]>([])
  const [exploreUsernames, setExploreUsernames] = useState<Story[]>([])
  const [selectedOwn, setSelectedOwn] = useState<Story | null>(null)
  const [selectedOther, setSelectedOther] = useState<Story | null>(null)
  
  // For idol username input
  const [idolUsername, setIdolUsername] = useState("")
  const [idolPlatform, setIdolPlatform] = useState("Twitter")
  
  // Input mode: 'idol' or 'explore'
  const [inputMode, setInputMode] = useState<'idol' | 'explore'>('idol')
  
  // Pairing state
  const [isPairing, setIsPairing] = useState(false)
  const [pairedUsername, setPairedUsername] = useState<any>(null)
  
  // Trading state
  const [showTrading, setShowTrading] = useState(false)
  const [nextAction, setNextAction] = useState<'write' | 'trade' | null>(null)

  const PLATFORMS = [
    "Base", "Farcaster", "Zora", "Twitter", "Instagram", "TikTok", "Facebook", "Other"
  ]

  // Fetch user's published usernames
  useEffect(() => {
    if (!address) return
    
    async function fetchStories() {
      try {
        const response = await fetch('/api/stories')
        const data = await response.json()
        
        // Filter own usernames
        const own = data.stories.filter((s: Story) => s.address === address)
        setOwnUsernames(own)
        
        // Filter explore usernames (exclude own)
        const others = data.stories.filter((s: Story) => s.address !== address)
        setExploreUsernames(others)
      } catch (error) {
        console.error('Failed to fetch stories:', error)
      }
    }
    
    fetchStories()
  }, [address])

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pair Your Names</h1>
        <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
          Connect your wallet to pair usernames and create new powerful combinations. 
          Trade them as unique on-chain assets.
        </p>
        <div className="mt-8">
          <ConnectWallet className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90" />
        </div>
      </div>
    )
  }

  const handlePair = async () => {
    if (!selectedOwn) {
      alert('Please select your username first')
      return
    }
    
    const username2 = inputMode === 'idol' ? idolUsername : selectedOther?.username
    if (!username2) {
      alert(inputMode === 'idol' ? 'Please enter idol username' : 'Please select a username from Explore')
      return
    }
    
    setIsPairing(true)
    
    try {
      const response = await fetch('/api/pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username1: selectedOwn.username,
          platform1: selectedOwn.platform,
          username2,
          platform2: inputMode === 'idol' ? idolPlatform : selectedOther?.platform || 'Unknown',
          creatorId: address,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create pair')
      }
      
      const data = await response.json()
      setPairedUsername(data.pair)
      setNextAction(null) // Show action buttons
    } catch (error) {
      console.error('Pairing error:', error)
      alert('Failed to create pair. Please try again.')
    } finally {
      setIsPairing(false)
    }
  }

  const handleWriteStory = () => {
    // Redirect to Write page with paired username pre-filled
    router.push(`/write?paired=${pairedUsername.pairedName}`)
  }

  const handleTradeUsername = () => {
    setShowTrading(true)
    setNextAction('trade')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pair Names</h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          Pair your username with your idol's username from any platform, 
          or choose one from the Explore list.
        </p>
      </div>

      {/* Section 1: Your Username */}
      <div className="mb-8">
        <label className="block text-lg font-bold text-foreground mb-4">
          Your Username
        </label>
        
        {ownUsernames.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              You haven't published any username yet.
            </p>
            <button
              onClick={() => router.push('/write')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Edit2 className="h-4 w-4" />
              Write Your First Story
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ownUsernames.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedOwn(story)}
                className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                  selectedOwn?.id === story.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-card'
                }`}
              >
                <p className={`text-base font-bold ${
                  selectedOwn?.id === story.id ? 'text-primary' : 'text-foreground'
                }`}>
                  @{story.username}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{story.platform}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Input Mode Toggle */}
      {ownUsernames.length > 0 && (
        <>
          <div className="mb-4">
            <label className="block text-lg font-bold text-foreground mb-4">
              Pair With
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInputMode('idol')}
                className={`rounded-xl py-3 px-4 text-base font-semibold transition-all ${
                  inputMode === 'idol'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                Idol Username
              </button>
              <button
                onClick={() => setInputMode('explore')}
                className={`rounded-xl py-3 px-4 text-base font-semibold transition-all ${
                  inputMode === 'explore'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                From Explore
              </button>
            </div>
          </div>

          {/* Section 3a: Idol Username Input */}
          {inputMode === 'idol' && (
            <div className="mb-8">
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Idol's Username
                </label>
                <input
                  type="text"
                  value={idolUsername}
                  onChange={(e) => setIdolUsername(e.target.value.replace('@', ''))}
                  placeholder="e.g. jessepollak"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary mb-3"
                />
                
                <label className="block text-sm font-medium text-foreground mb-2">
                  Platform
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setIdolPlatform(platform)}
                      className={`rounded-lg py-2 px-3 text-xs font-medium transition-colors ${
                        idolPlatform === platform
                          ? 'bg-primary/20 text-primary border border-primary'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3b: Explore List */}
          {inputMode === 'explore' && (
            <div className="mb-8">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-foreground">
                    Select from Explore
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {exploreUsernames.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => setSelectedOther(story)}
                      className={`rounded-lg border-2 px-3 py-2 text-left transition-all overflow-hidden ${
                        selectedOther?.id === story.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 bg-background'
                      }`}
                    >
                      <p className={`text-sm font-bold truncate ${
                        selectedOther?.id === story.id ? 'text-primary' : 'text-foreground'
                      }`}>
                        @{story.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{story.platform}</p>
                    </button>
                  ))}
                </div>
                
                {exploreUsernames.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No usernames available in Explore yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Pair Preview & Actions */}
          {selectedOwn && (inputMode === 'idol' ? idolUsername : selectedOther) && (
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              {!pairedUsername ? (
                // Before pairing
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Paired Username Preview</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-xl font-bold text-foreground">
                        {selectedOwn.username}
                      </span>
                      <Plus className="h-5 w-5 text-primary" />
                      <span className="text-xl font-bold text-foreground">
                        {inputMode === 'idol' ? idolUsername : selectedOther!.username}
                      </span>
                    </div>
                    <div className="inline-block rounded-full bg-primary/20 px-4 py-2">
                      <span className="text-lg font-bold text-primary">
                        {selectedOwn.username}×{inputMode === 'idol' ? idolUsername : selectedOther!.username}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePair}
                    disabled={isPairing}
                    className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isPairing ? 'Creating Pair...' : 'Create Pair'}
                  </button>
                </>
              ) : (
                // After pairing
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        Pair Created Successfully!
                      </p>
                    </div>
                    <div className="inline-block rounded-full bg-primary/20 px-6 py-3 mb-2">
                      <span className="text-2xl font-bold text-primary">
                        {pairedUsername.pairedName}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Starting price: <span className="font-semibold text-foreground">0.7 USDC</span>
                    </p>
                  </div>

                  {!nextAction && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleWriteStory}
                        className="rounded-xl border-2 border-primary bg-card py-3 px-4 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="h-4 w-4 mx-auto mb-1" />
                        Write & Publish
                      </button>
                      <button
                        onClick={handleTradeUsername}
                        className="rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 mx-auto mb-1" />
                        Trade Username
                      </button>
                    </div>
                  )}

                  {/* Trading Terminal */}
                  {showTrading && (
                    <div className="mt-6">
                      <TradingTerminal
                        pairedUsername={pairedUsername.pairedName}
                        username1={pairedUsername.username1}
                        username2={pairedUsername.username2}
                        currentPrice={pairedUsername.currentPrice}
                        pairId={pairedUsername.id}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Info Card */}
      <div className="mt-8 rounded-xl border border-border bg-accent/40 p-4">
        <p className="text-sm font-medium text-foreground mb-2">💡 How Pairing Works</p>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• Combine two usernames to create a unique tradeable asset</li>
          <li>• Write a philosophy story for your paired username</li>
          <li>• Trade paired usernames on-chain starting at 0.7 USDC</li>
          <li>• Price increases with demand from the community</li>
        </ul>
      </div>
    </div>
  )
}
