"use client"

import { useEffect } from "react"
import sdk from "@farcaster/frame-sdk"

/**
 * FarcasterReady
 *
 * Calls sdk.actions.ready() on mount to dismiss the Farcaster splash screen.
 * Must be a client component — SDK requires browser environment.
 * Renders nothing, purely a side-effect component.
 */
export function FarcasterReady() {
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  return null
}