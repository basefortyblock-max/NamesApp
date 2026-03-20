"use client"

/**
 * components/farcaster-auto-connect.tsx
 *
 * Auto-connects wallet when app is opened inside Farcaster Mini App.
 * MUST be placed inside <Providers> in layout.tsx (needs WagmiProvider context).
 *
 * - Inside Farcaster: sdk.context returns user data → auto-connect wallet silently
 * - In browser: sdk.context returns null → no auto-connect, user clicks RainbowKit button
 */

import { useEffect } from "react"
import sdk from "@farcaster/frame-sdk"
import { useConnect, useAccount } from "wagmi"
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector"

export function FarcasterAutoConnect() {
  const { connect } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    async function autoConnect() {
      try {
        const context = await sdk.context
        if (context?.user && !isConnected) {
          connect({ connector: farcasterMiniApp() })
        }
      } catch {
        // Not in Farcaster context — silent fail
      }
    }

    autoConnect()
  }, [])

  return null
}