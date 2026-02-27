'use client'

import { Share2 } from 'lucide-react'

interface ShareToFarcasterProps {
  storyId: string
  username: string
  text: string
}

export function ShareToFarcaster({ storyId, username, text }: ShareToFarcasterProps) {
  const shareToFarcaster = () => {
    const url = `https://names-app.vercel.app/story/${storyId}`
    const shareText = `Check out @${username}'s name philosophy on Names! 🎭\n\n"${text.substring(0, 100)}..."\n\n${url}`
    
    // Warpcast deep link
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`
    
    window.open(warpcastUrl, '_blank')
  }
  
  return (
    <button
      onClick={shareToFarcaster}
      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
    >
      <Share2 className="h-4 w-4" />
      Share on Farcaster
    </button>
  )
}