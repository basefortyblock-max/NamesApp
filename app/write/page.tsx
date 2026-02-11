"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { useStories } from "@/lib/stories-context"
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react"

const PLATFORMS = [
  "Base",
  "Twitter",
  "Instagram",
  "TikTok",
  "Facebook",
  "Other",
]

export default function WritePage() {
  const { isConnected, basename, address, connect } = useWallet()
  const { addStory } = useStories()
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [platform, setPlatform] = useState("Base")
  const [story, setStory] = useState("")
  const [step, setStep] = useState<"input" | "verify" | "write" | "confirm">("input")
  const [isVerified, setIsVerified] = useState(false)

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Connect Your Wallet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to connect your wallet to share your name philosophy.
        </p>
        <button
          onClick={connect}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    )
  }

  const handleVerify = () => {
    if (!username.trim()) return
    // Simulate Base profile verification
    setTimeout(() => {
      setIsVerified(true)
      setStep("write")
    }, 800)
    setStep("verify")
  }

  const handlePublish = () => {
    if (!story.trim() || !username.trim()) return
    setStep("confirm")
  }

  const handleConfirmPublish = () => {
    addStory({
      username,
      platform,
      basename: basename || "anon.base.eth",
      address: address || "0x0000...0000",
      story,
    })
    router.push("/")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">Share Your Name Philosophy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
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
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
              Your Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. SatoshiDreamer"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Type the username you want to share the philosophy about.
            </p>
          </div>

          <div>
            <label htmlFor="platform" className="mb-1.5 block text-sm font-medium text-foreground">
              Platform
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    platform === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={!username.trim()}
            className="mt-2 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Verifying */}
      {step === "verify" && (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          {!isVerified ? (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Verifying Base profile for <span className="font-semibold text-foreground">{username}</span>...</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-sm text-foreground">Profile verified. Redirecting to story editor...</p>
            </>
          )}
        </div>
      )}

      {/* Step 3: Story editor */}
      {step === "write" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/70 px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{username}</p>
              <p className="text-xs text-muted-foreground">{platform} · {basename}</p>
            </div>
          </div>

          <div>
            <label htmlFor="story" className="mb-1.5 block text-sm font-medium text-foreground">
              Your Name Philosophy
            </label>
            <textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Tell the world why you chose this name. Is it historical? Does it bring good luck, blessings, health? What is the charismatic philosophy behind it?"
              rows={8}
              className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Write in any language you prefer.
              </p>
              <p className="text-xs text-muted-foreground">{story.length} chars</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-accent/40 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p>Your story starts at <span className="font-semibold text-foreground">0.01 USDC</span>. The more users appreciate your story, the higher the price grows.</p>
              <p className="mt-1">No gas fees. Names app handles all transactions.</p>
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={!story.trim()}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Publish Philosophy
          </button>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <span className="text-sm font-bold text-primary">{username.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{username}</p>
                <p className="text-xs text-muted-foreground">{platform} · {basename}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{story}</p>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
              <span className="font-semibold">Starting Price: 0.01 USDC</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Please confirm you want to publish this philosophy. This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("write")}
              className="flex-1 rounded-lg border border-border bg-card py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Edit
            </button>
            <button
              onClick={handleConfirmPublish}
              className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Confirm & Publish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
