"use client"

/**
 * components/farcaster-ready.tsx
 *
 * CHANGES:
 * - After calling sdk.actions.ready(), check if running inside Farcaster frame
 * - If yes, auto-connect wallet using farcasterFrame connector via wagmi connect()
 * - If already connected, skip — no double-connect
 * - In browser (non-frame context), sdk.context returns null → no auto-connect
 */

import { useEffect } from "react"
import sdk from "@farcaster/frame-sdk"
import { useConnect, useAccount } from "wagmi"
import { farcasterFrame } from "@farcaster/frame-wagmi-connector"

export function FarcasterReady() {
  const { connect } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    async function init() {
      // Dismiss Farcaster splash screen
      sdk.actions.ready()

      // Check if running inside a Farcaster frame/mini app
      const context = await sdk.context

      if (context?.user && !isConnected) {
        // ✅ Auto-connect wallet when inside Farcaster and not yet connected
        connect({ connector: farcasterFrame() })
      }
    }

    init()
  }, []) // run once on mount

  return null
}