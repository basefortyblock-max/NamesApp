"use client"

/**
 * app/pair/[id]/trade/page.tsx
 *
 * CHANGES:
 * - Passes onchainTokenId (from pair.tokenId in DB) to TradingTerminal
 * - TradingTerminal uses onchainTokenId for real contract calls if it exists
 * - Falls back to off-chain mode if tokenId is null (legacy records)
 */

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { TradingTerminal } from "@/components/trading-terminal"

interface PairData {
  id: string
  username1: string
  username2: string
  pairedName: string
  creator: string
  ownerAddress?: string
  currentPrice: number
  forSale: boolean
  tokenId?: number | null  // ✅ uint256 from contract, null for legacy
  createdAt: string
}

export default function TradePage() {
  const params = useParams()
  const router = useRouter()
  const pairId = params.id as string

  const [pair, setPair] = useState<PairData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPair()
  }, [pairId])

  async function fetchPair() {
    try {
      const res = await fetch(`/api/pairs/${pairId}`)
      if (!res.ok) { setError('Pair not found'); return }
      const data = await res.json()
      setPair(data.pair)
    } catch {
      setError('Failed to load pair data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !pair) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-base text-muted-foreground mb-4">{error || 'Pair not found'}</p>
        <button
          onClick={() => router.push('/pair')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />Back to Pair
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <button
        onClick={() => router.push('/pair')}
        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />Back to Pair
      </button>

      <TradingTerminal
        pairedUsername={pair.pairedName}
        username1={pair.username1}
        username2={pair.username2}
        currentPrice={pair.currentPrice}
        pairId={pair.id}
        tokenId={pair.id}
        onchainTokenId={pair.tokenId ?? null} // ✅ null = off-chain, number = onchain
        creator={pair.ownerAddress || pair.creator}
      />
    </div>
  )
}