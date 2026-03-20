"use client"

/**
 * components/farcaster-ready.tsx
 *
 * CHANGES:
 * - Updated to @farcaster/miniapp-wagmi-connector (replaces deprecated frame-wagmi-connector)
 * - connector passed directly to connect() — no need to register in wagmi config
 * - sdk.actions.ready() called first to dismiss splash screen
 * - Auto-connects wallet only if inside Farcaster frame context and not yet connected
 * - Safe in browser: sdk.context returns null outside frame, no auto-connect triggered
 */

import { useEffect } from "react"
import sdk from "@farcaster/frame-sdk"
import { useConnect, useAccount } from "wagmi"
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector"

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
        // Auto-connect wallet when inside Farcaster — no wallet popup needed
        connect({ connector: farcasterMiniApp() })
      }
    }

    init()
  }, []) // run once on mount

  return null
}