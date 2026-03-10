'use client'

import { useEffect, useState } from 'react'

export function FarcasterLogin() {
  const [fid, setFid] = useState<string | null>(null)
  
  const loginWithFarcaster = async () => {
    // Use Farcaster Auth Kit
    const { createAppClient, viemConnector } = await import('@farcaster/auth-kit')
    
    const appClient = createAppClient({
      relay: 'https://relay.farcaster.xyz',
      ethereum: viemConnector(),
    })
    
    const channel = await appClient.createChannel({
      siweUri: 'https://names-app.vercel.app',
      domain: 'names-app.vercel.app',
    })

    const { channelToken, url } = channel as any
    
    // Open Farcaster app for authentication
    window.open(url, '_blank')
    
    // Poll for authentication result
    const result = (await appClient.watchStatus({
      channelToken,
      timeout: 60000,
    })) as any
    
    if (result.state === 'completed') {
      setFid(result.fid.toString())
      // Save to your backend
      await fetch('/api/user/link-farcaster', {
        method: 'POST',
        body: JSON.stringify({
          fid: result.fid,
          username: result.username,
        }),
      })
    }
  }
  
  return (
    <button
      onClick={loginWithFarcaster}
      className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white"
    >
      Sign in with Farcaster
    </button>
  )
}