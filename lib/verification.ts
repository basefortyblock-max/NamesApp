// lib/verification.ts - Simplified (No OAuth)
/**
 * Simplified verification for Base ecosystem only
 * No OAuth - just API verification
 */

interface FarcasterUser {
  fid: number
  username: string
  displayName?: string
  pfpUrl?: string
}

interface ZoraProfile {
  address: string
  displayName?: string
  ensName?: string
}

/**
 * Verify Farcaster username using Warpcast API
 */
export async function verifyFarcasterUsername(username: string): Promise<{
  verified: boolean
  user?: FarcasterUser
}> {
  try {
    const cleanUsername = username.replace('@', '')
    
    const response = await fetch(
      `https://api.warpcast.com/v2/user-by-username?username=${cleanUsername}`
    )
    
    if (!response.ok) {
      return { verified: false }
    }
    
    const data = await response.json()
    
    if (!data.result || !data.result.user) {
      return { verified: false }
    }
    
    const user = data.result.user
    
    return {
      verified: true,
      user: {
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfp?.url,
      },
    }
  } catch (error) {
    console.error('Farcaster verification error:', error)
    return { verified: false }
  }
}

/**
 * Verify Zora profile (ENS or address)
 */
export async function verifyZoraProfile(identifier: string): Promise<{
  verified: boolean
  profile?: ZoraProfile
}> {
  try {
    // Check if it's an address
    if (identifier.startsWith('0x') && identifier.length === 42) {
      return {
        verified: true,
        profile: {
          address: identifier,
        },
      }
    }
    
    // Check if it's an ENS name
    if (identifier.endsWith('.eth')) {
      // Try to resolve ENS
      const profile = await resolveENS(identifier)
      if (profile) {
        return {
          verified: true,
          profile,
        }
      }
    }
    
    // Try adding .eth
    const ensProfile = await resolveENS(`${identifier}.eth`)
    if (ensProfile) {
      return {
        verified: true,
        profile: ensProfile,
      }
    }
    
    return { verified: false }
  } catch (error) {
    console.error('Zora verification error:', error)
    return { verified: false }
  }
}

/**
 * Resolve ENS name to address
 */
async function resolveENS(ensName: string): Promise<ZoraProfile | null> {
  try {
    // Use public ENS resolver or your own
    // This is a placeholder - adjust based on your ENS resolution method
    
    // Option 1: Use a public API
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
    }
  } catch (error) {
    console.error('ENS resolution error:', error)
    return null
  }
}

/**
 * Verify Base username (via signature)
 * This is just a placeholder - actual verification happens on client via SIWE
 */
export function verifyBaseUsername(username: string, address: string): {
  verified: boolean
  message: string
} {
  // Generate message for signing
  const message = `Verify ownership of username: ${username}\nAddress: ${address}\nTimestamp: ${Date.now()}`
  
  return {
    verified: true,
    message,
  }
}