// app/write/page.tsx 
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAccount, useSignMessage } from "wagmi"
import { ConnectWallet } from "@coinbase/onchainkit/wallet"
import { Wallet, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react"

// Only Base, Farcaster, Zora - NO OAuth platforms
const PLATFORMS = [
  { value: "Base", label: "Base", icon: "🔵", needsAuth: false },
  { value: "Farcaster", label: "Farcaster", icon: "🟣", needsAuth: false },
  { value: "Zora", label: "Zora", icon: "⚫", needsAuth: false },
]

export default function WritePage() {
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [username, setUsername] = useState("")
  const [platform, setPlatform] = useState("Base")
  const [story, setStory] = useState("")
  const [step, setStep] = useState<"input" | "verify" | "write" | "confirm">("input")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationError, setVerificationError] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [isPublishing, setIsPublishing] = useState(false)

  // Check if this is from paired username
  useEffect(() => {
    const pairedParam = searchParams?.get('paired')
    if (pairedParam) {
      setUsername(pairedParam)
      setPlatform("Base") // Paired usernames default to Base
    }
  }, [searchParams])

  // Update word count
  useEffect(() => {
    const words = story.trim().split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
  }, [story])

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Connect Your Wallet</h1>
        <p className="mt-2 text-base text-muted-foreground">
          You need to connect your wallet to share your name philosophy.
        </p>
        <div className="mt-5">
          <ConnectWallet className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </ConnectWallet>
        </div>
      </div>
    )
  }

  const handleVerify = async () => {
    if (!username.trim()) return
    
    setIsVerifying(true)
    setVerificationError("")
    setStep("verify")
    
    try {
      if (platform === "Base") {
        // Base: Sign message to verify ownership
        const message = `Verify ownership of username: ${username}\nAddress: ${address}\nTimestamp: ${Date.now()}`
        await signMessageAsync({ message })
        
        // Save verification
        await fetch('/api/user/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            platform: 'Base',
            username,
            verified: true,
          }),
        })
        
        setIsVerified(true)
        setTimeout(() => setStep("write"), 800)
        
      } else if (platform === "Farcaster") {
        // Farcaster: Verify via API
        const response = await fetch('/api/verify/farcaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.verified) {
          throw new Error('Farcaster username not found')
        }
        
        // Save verification
        await fetch('/api/user/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            platform: 'Farcaster',
            username,
            verified: true,
            platformData: data.user,
          }),
        })
        
        setIsVerified(true)
        setTimeout(() => setStep("write"), 800)
        
      } else if (platform === "Zora") {
        // Zora: Verify ENS or address
        const response = await fetch('/api/verify/zora', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: username }),
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.verified) {
          throw new Error('Zora profile not found')
        }
        
        // Save verification
        await fetch('/api/user/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            platform: 'Zora',
            username,
            verified: true,
            platformData: data.profile,
          }),
        })
        
        setIsVerified(true)
        setTimeout(() => setStep("write"), 800)
      }
    } catch (error: any) {
      setVerificationError(error.message || 'Verification failed')
      setIsVerifying(false)
      setStep("input")
    }
  }

  const handlePublish = () => {
    if (!story.trim() || !username.trim()) return
    
    // Check word limit (490 words - 7x7x10 philosophy)
    if (wordCount > 490) {
      alert('Story exceeds 490 words limit')
      return
    }
    
    setStep("confirm")
  }

  const handleConfirmPublish = async () => {
    setIsPublishing(true)
    
    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: address, // FIX: was 'address', now 'userId'
          username,
          platform,
          story,
          verified: isVerified,
        }),
      })
      
      if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to publish')
    }
    
    alert('✅ Published! Starting price: 0.7 USDC')
    router.push('/')
  } catch (error: any) {
    console.error('Publish error:', error)
    alert(`❌ ${error.message}`)
    setIsPublishing(false)
  }
}

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">Share Your Name Philosophy</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Tell the world the charismatic story behind your username.
      </p>

      {/* Step indicators */}
      <div className="mt-6 flex gap-1">
        {["Username", "Verify", "Story", "Publish"].map((label, i) => {
          const stepIdx =
            step === "input" ? 0 : step === "verify" ? 1 : step === "write" ? 2 : 3
          return (
            <div key={label} className="flex flex-1 flex-col gap-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= stepIdx ? "bg-primary" : "bg-border"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  i <= stepIdx ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step 1: Username input */}
      {step === "input" && (
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-base font-medium text-foreground">
              Your Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace('@', ''))}
              placeholder="e.g. SatoshiDreamer (without @)"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Type username without @ symbol
            </p>
          </div>

          <div>
            <label htmlFor="platform" className="mb-1.5 block text-base font-medium text-foreground">
              Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                    platform === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Only Base ecosystem platforms (Base, Farcaster, Zora)
            </p>
          </div>

          {verificationError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {verificationError}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={!username.trim() || isVerifying}
            className="mt-2 w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      )}

      {/* Step 2: Verifying */}
      {step === "verify" && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          {!isVerified ? (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-base text-muted-foreground">
                Verifying <span className="font-semibold text-foreground">@{username}</span> on {platform}...
              </p>
              {platform === "Base" && (
                <p className="text-sm text-muted-foreground">
                  Please sign the message in your wallet
                </p>
              )}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-base text-foreground">Verified successfully!</p>
            </>
          )}
        </div>
      )}

      {/* Step 3: Story editor */}
      {step === "write" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/70 px-3 py-2.5">
            <Shield className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-base font-medium text-foreground">@{username}</p>
              <p className="text-sm text-muted-foreground">
                {platform} · Verified
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="story" className="mb-1.5 block text-base font-medium text-foreground">
              Your Name Philosophy
            </label>
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell the world why you chose this name. Is it historical? Does it bring good luck, blessings, health? What is the charismatic philosophy behind it?"
              rows={10}
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Write in any language you prefer.</p>
              <p className={`text-sm font-medium ${wordCount > 490 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {wordCount}/490 words
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-accent/40 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-sm leading-relaxed text-muted-foreground">
              <p>
                Your story starts at <span className="font-semibold text-foreground">0.7 USDC</span>. 
                The more users appreciate your story, the higher the price grows.
              </p>
              <p className="mt-1">No gas fees. Names app handles all transactions.</p>
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={!story.trim() || wordCount > 490}
            className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Continue to Publish
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <span className="text-base font-bold text-primary">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">@{username}</p>
                <p className="text-sm text-muted-foreground">{platform} · Verified</p>
              </div>
            </div>
            <p className="mt-3 text-base leading-relaxed text-foreground">{story}</p>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-primary">
              <span className="font-semibold">Starting Price: 0.7 USDC</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Please confirm you want to publish this philosophy. This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("write")}
              disabled={isPublishing}
              className="flex-1 rounded-lg border border-border bg-card py-3 text-base font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            >
              Edit
            </button>
            <button
              onClick={handleConfirmPublish}
              disabled={isPublishing}
              className="flex-1 rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {isPublishing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </span>
              ) : (
                'Confirm & Publish'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

