// lib/oauth/farcaster.ts

/**
 * Farcaster uses Sign-In with Farcaster (SIWF)
 * Similar to Sign-In with Ethereum (SIWE)
 */

interface FarcasterUser {
  fid: number // Farcaster ID
  username: string
  displayName?: string
  pfpUrl?: string
  bio?: string
}

/**
 * Verify Farcaster username using Warpcast API
 */
export async function verifyFarcasterUsername(username: string): Promise<FarcasterUser | null> {
  try {
    // Remove @ if present
    const cleanUsername = username.replace('@', '')
    
    // Use Warpcast API to get user info
    const response = await fetch(
      `https://api.warpcast.com/v2/user-by-username?username=${cleanUsername}`
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (!data.result || !data.result.user) {
      return null
    }
    
    const user = data.result.user
    
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfp?.url,
      bio: user.profile?.bio?.text,
    }
  } catch (error) {
    console.error('Farcaster verification error:', error)
    return null
  }
}

/**
 * Get Farcaster user by FID
 */
export async function getFarcasterUserByFid(fid: number): Promise<FarcasterUser | null> {
  try {
    const response = await fetch(`https://api.warpcast.com/v2/user?fid=${fid}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (!data.result || !data.result.user) {
      return null
    }
    
    const user = data.result.user
    
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfp?.url,
      bio: user.profile?.bio?.text,
    }
  } catch (error) {
    console.error('Get Farcaster user error:', error)
    return null
  }
}

/**
 * Generate Sign-In with Farcaster message
 * This will be verified on the client side using Farcaster Auth Kit
 */
export function generateSIWFMessage(params: {
  domain: string
  address: string
  statement: string
  nonce: string
}): string {
  return `${params.domain} wants you to sign in with your Farcaster account:

${params.address}

${params.statement}

Nonce: ${params.nonce}
Issued At: ${new Date().toISOString()}`
}

// ===== ZORA HELPERS =====

interface ZoraProfile {
  address: string
  displayName?: string
  ensName?: string
  avatarUrl?: string
}

/**
 * Verify Zora profile (using ENS or address)
 */
export async function verifyZoraProfile(identifier: string): Promise<ZoraProfile | null> {
  try {
    // Check if it's an ENS name
    if (identifier.endsWith('.eth')) {
      return await resolveENS(identifier)
    }
    
    // Check if it's an address
    if (identifier.startsWith('0x') && identifier.length === 42) {
      return {
        address: identifier,
      }
    }
    
    // Otherwise, try to resolve as ENS
    return await resolveENS(`${identifier}.eth`)
  } catch (error) {
    console.error('Zora verification error:', error)
    return null
  }
}

/**
 * Resolve ENS name to address
 */
async function resolveENS(ensName: string): Promise<ZoraProfile | null> {
  try {
    // Use a public ENS resolver
    const response = await fetch(`https://api.ensideas.com/ens/resolve/${ensName}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (!data.address) {
      return null
    }
    
    return {
      address: data.address,
      ensName: ensName,
      displayName: data.displayName,
      avatarUrl: data.avatar,
    }
  } catch (error) {
    console.error('ENS resolution error:', error)
    return null
  }
}

/**
 * Get Zora profile data from Zora API
 */
export async function getZoraProfile(address: string): Promise<ZoraProfile | null> {
  try {
    // Zora API endpoint (if available)
    // This is a placeholder - adjust based on actual Zora API
    const response = await fetch(`https://api.zora.co/v1/user/${address}`)
    
    if (!response.ok) {
      return {
        address,
      }
    }
    
    const data = await response.json()
    
    return {
      address,
      displayName: data.displayName,
      ensName: data.ensName,
      avatarUrl: data.avatarUrl,
    }
  } catch (error) {
    // If Zora API is not available, just return address
    return {
      address,
    }
  }
}

/**
 * Verify Base name (basename)
 */
export async function verifyBasename(basename: string): Promise<{
  address: string
  basename: string
} | null> {
  try {
    // Base names are ENS names on Base L2
    // Remove .base.eth if present, we'll add it
    const cleanName = basename.replace('.base.eth', '')
    const fullBasename = `${cleanName}.base.eth`
    
    // Use Base name resolver
    // This is a placeholder - adjust based on actual Base name API
    const response = await fetch(`https://api.basename.app/v1/resolve/${fullBasename}`)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    return {
      address: data.address,
      basename: fullBasename,
    }
  } catch (error) {
    console.error('Basename verification error:', error)
    return null
  }
}