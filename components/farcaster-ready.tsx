"use client"

/**
 * components/farcaster-ready.tsx
 *
 * FIX: Removed useConnect and useAccount wagmi hooks — this component is placed
 * outside WagmiProvider in layout.tsx, causing WagmiProviderNotFoundError on build.
 *
 * This component now ONLY dismisses the Farcaster splash screen.
 * Auto-connect for Farcaster is handled by FarcasterAutoConnect (below)
 * which must be placed INSIDE <Providers> in layout.tsx.
 */

import { useEffect } from "react"
import sdk from "@farcaster/frame-sdk"

export function FarcasterReady() {
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  return null
}