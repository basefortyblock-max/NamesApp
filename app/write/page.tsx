"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAccount, useSignMessage } from "wagmi"
import { WalletConnect } from "@/components/connect-wallet-button"
import { Wallet, CheckCircle2, AlertCircle, Loader2, Shield, Sparkles } from "lucide-react"

export default function WritePage() {
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [username, setUsername] = useState("")
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
          <WalletConnect />
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
      // Simple wallet signature verification
      const message = `Verify username ownership: ${username}\nWallet: ${address}\nTimestamp: ${Date.now()}`
      await signMessageAsync({ message })
      
      setIsVerified(true)
      setTimeout(() => setStep("write"), 800)
      
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
          userId: address,
          username: username.trim(),
          platform: 'Base', // All usernames are on Base now
          story: story.trim(),
          verified: isVerified,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish')
      }
      
      alert('✅ Story published! Starting price: 0.7 USDC')
      window.location.href = '/'
      
    } catch (error: any) {
      console.error('❌ Error:', error)
      alert(`❌ ${error.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">Publish Your Username Story</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Share the charismatic philosophy behind your username
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
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">One wallet, unlimited usernames</p>
                <p className="text-muted-foreground">
                  You can publish multiple username stories from a single wallet. Each username tells a unique story.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-base font-medium text-foreground">
              Your Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace('@', '').trim())}
              placeholder="e.g. SatoshiDreamer (without @)"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Type username without @ symbol
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
                Verifying <span className="font-semibold text-foreground">@{username}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Please sign the message in your wallet
              </p>
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
                Verified by wallet signature
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="story" className="mb-1.5 block text-base font-medium text-foreground">
              Your Username Philosophy
            </label>
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Why did you choose this username? Does it carry historical significance, bring good fortune, represent health, or embody a charismatic philosophy? Share the meaningful story that makes this name uniquely yours."
              rows={10}
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Maximum 490 words</p>
              <p className={`text-sm font-medium ${wordCount > 490 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {wordCount}/490 words
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-foreground mb-1">
                Your story is high-value content
              </p>
              <p className="text-muted-foreground">
                Base price starts at <span className="font-semibold text-foreground">0.7 USDC</span>. 
                When readers appreciate your philosophy and send value, you earn directly. 
                Share wisdom, inspire others, and get rewarded.
              </p>
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
                <p className="text-sm text-muted-foreground">Verified by wallet</p>
              </div>
            </div>
            <p className="mt-3 text-base leading-relaxed text-foreground">{story}</p>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-primary">
              <span className="font-semibold">Starting Price: 0.7 USDC</span>
            </div>
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
              ⚠️ This action cannot be undone
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Once published, your story will be permanently saved on-chain
            </p>
          </div>

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
