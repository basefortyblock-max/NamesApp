"use client"

/**
 * Write flow — 3 steps: username → philosophy → confirm.
 * Replaces old /write page (Phase 1 cleanup).
 *
 * Removed:
 * - multi-step signature verification loops
 * - 490-word limit unchanged BUT now 1-490 (block empty)
 * - Sign-message step simplified (wallet signature is fast-pace, not blocking)
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useSignMessage } from "wagmi"
import { WalletConnect } from "@/components/connect-wallet-button"
import { PenSquare, Shield, AlertCircle, Loader2 } from "lucide-react"
import { Platform, PLATFORMS } from "@/lib/constants"

export default function WritePage() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [username, setUsername] = useState("")
  const [platform, setPlatform] = useState<Platform>("base")
  const [philosophy, setPhilosophy] = useState("")
  const [step, setStep] = useState<"input" | "confirm" | "publishing">("input")
  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <PenSquare className="mx-auto h-10 w-10 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Publish Your Story</h1>
        <p className="text-base text-muted-foreground mb-6">
          Connect wallet to share the story behind your username.
        </p>
        <div className="inline-flex">
          <WalletConnect />
        </div>
      </div>
    )
  }

  const wordCount = philosophy.trim().split(/\s+/).filter(Boolean).length
  const cleanUsername = username.replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "")
  const usernameValid = cleanUsername.length >= 1 && cleanUsername.length <= 32
  const philosophyValid = wordCount >= 1 && wordCount <= 490

  async function handleVerify() {
    if (!usernameValid) return setError("Username 1-32 chars (letters, numbers, _-)")
    if (!philosophyValid) return setError(`Philosophy must be 1-490 words (got ${wordCount})`)
    setError("")

    // Wallet signature as soft verification (proves ownership of address)
    try {
      setVerifying(true)
      const message = `Publish story for @${cleanUsername} on Names × x402 from ${address}`
      await signMessageAsync({ message })
      setStep("confirm")
    } catch (e: any) {
      if (e?.code === "ACTION_REJECTED" || e?.message?.includes("rejected")) {
        setError("Signature cancelled")
      } else {
        setError(e?.message || "Signature failed")
      }
    } finally {
      setVerifying(false)
    }
  }

  async function handlePublish() {
    setStep("publishing")
    setError("")
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          username: cleanUsername,
          platform,
          philosophy: philosophy.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Publish failed")
      router.push(`/u/${cleanUsername}`)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      setStep("confirm")
    }
  }

  if (step === "confirm") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold mb-1">Confirm</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Review before publishing.
        </p>
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="text-base font-bold mb-1">@{cleanUsername}</p>
          <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs mr-2">
            {platform}
          </span>
          <p className="mt-3 text-sm whitespace-pre-wrap">{philosophy}</p>
        </article>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setStep("input")}
            className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold hover:bg-secondary"
          >
            Back
          </button>
          <button
            onClick={handlePublish}
            className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Publish
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold">Publish Your Story</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Share what makes your username yours.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
            placeholder="e.g. satoshiBuilder"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            1-32 chars, letters/numbers/_/- (no @)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Platform</label>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.slice(0, 8).map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`rounded-lg py-2 text-xs font-medium border ${
                  platform === p.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Philosophy
          </label>
          <textarea
            value={philosophy}
            onChange={(e) => setPhilosophy(e.target.value)}
            placeholder="Why does this username mean what it means to you?"
            rows={8}
            className="w-full resize-none rounded-lg border border-input bg-card px-3 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="mt-1 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Max 490 words</span>
            <span
              className={`font-medium ${
                wordCount > 490 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {wordCount}/490
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 px-3 py-2.5 flex gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            We'll ask your wallet to sign a verification message. This proves
            ownership without needing OAuth or accounts.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || !usernameValid || !philosophyValid}
          className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {verifying ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sign message...
            </span>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  )
}
