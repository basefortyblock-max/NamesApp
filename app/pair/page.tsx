"use client"

/**
 * app/pair/page.tsx
 *
 * FIX: useSearchParams() must be wrapped in <Suspense> in Next.js App Router.
 * Solution: extract the main component into PairPageContent,
 * wrap it with Suspense in the default export.
 */

import { useState, useEffect, Suspense } from "react"
import { useAccount } from "wagmi"
import { useRouter, useSearchParams } from "next/navigation"
import { WalletConnect } from "@/components/connect-wallet-button"
import { BrowserProvider, Contract } from "ethers"
import {
  Wallet, CheckCircle2, AlertCircle, Loader2,
  Shield, Users, ArrowRight, TrendingUp, BookOpen
} from "lucide-react"
import { DisclaimerModal } from "@/components/disclaimer-modal"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT!

const MINT_ABI = [
  'function mintPairedUsername(string username1, string platform1, string username2, string platform2) external returns (uint256)',
  'event UsernamePaired(uint256 indexed tokenId, address indexed creator, string pairedName, string username1, string username2)',
]

interface UserAccount {
  username: string
  platform: string
  verified: boolean
}

interface AvailableUser {
  address: string
  username: string
  platform: string
  verified: boolean
  openForPairing: boolean
}

interface MintResult {
  pairedName: string
  pairId: string
  tokenId?: string
}

interface PairData {
  id: string
  pairedName: string
  username1: string
  username2: string
  currentPrice: number
  forSale: boolean
  tokenId?: number | null
  createdAt: string
}

// ✅ Inner component uses useSearchParams — must be inside <Suspense>
function PairPageContent() {
  const { isConnected, address } = useAccount()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [myAccounts, setMyAccounts] = useState<UserAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [showAvailable, setShowAvailable] = useState(false)
  const [openForPairing, setOpenForPairing] = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [selectedAccount1, setSelectedAccount1] = useState<UserAccount | null>(null)
  const [selectedAccount2, setSelectedAccount2] = useState<UserAccount | null>(null)
  const [selectedOther, setSelectedOther] = useState<AvailableUser | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [isPairing, setIsPairing] = useState(false)
  const [mintStatus, setMintStatus] = useState<string>('')
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [showPostMintModal, setShowPostMintModal] = useState(false)
  const [myPairs, setMyPairs] = useState<PairData[]>([])

  useEffect(() => {
    if (address) {
      fetchMyAccounts()
      fetchPairingStatus()
      fetchMyPairs()
    }
  }, [address])

  // ✅ Auto-open available users when ?user= param exists
  useEffect(() => {
    const userParam = searchParams.get('user')
    if (userParam) setShowAvailable(true)
  }, [searchParams])

  useEffect(() => {
    if (showAvailable) fetchAvailableUsers()
  }, [showAvailable])

  // ✅ Pre-select user after availableUsers loads
  useEffect(() => {
    const userParam = searchParams.get('user')
    if (!userParam || availableUsers.length === 0) return
    const found = availableUsers.find(
      u => u.address.toLowerCase() === userParam.toLowerCase()
    )
    if (found) setSelectedOther(found)
  }, [searchParams, availableUsers])

  async function fetchMyAccounts() {
    try {
      const res = await fetch(`/api/user/stories?address=${address}`)
      const data = await res.json()
      setMyAccounts(data.stories?.map((s: any) => ({
        username: s.username,
        platform: s.platform,
        verified: s.verified,
      })) || [])
    } catch (e) {
      console.error('Failed to fetch accounts:', e)
    } finally {
      setLoadingAccounts(false)
    }
  }

  async function fetchPairingStatus() {
    try {
      const res = await fetch(`/api/user/toggle-pairing?address=${address}`)
      const data = await res.json()
      setOpenForPairing(data.openForPairing || false)
    } catch (e) {
      console.error('Failed to fetch pairing status:', e)
    }
  }

  async function fetchMyPairs() {
    try {
      const res = await fetch(`/api/pairs/mint?address=${address}`)
      const data = await res.json()
      setMyPairs(data.pairs || [])
    } catch (e) {
      console.error('Failed to fetch pairs:', e)
    }
  }

  async function fetchAvailableUsers() {
    try {
      const res = await fetch('/api/users/available')
      const data = await res.json()
      setAvailableUsers(
        data.users?.filter((u: AvailableUser) =>
          u.address !== address && u.openForPairing
        ) || []
      )
    } catch (e) {
      console.error('Failed to fetch available users:', e)
    }
  }

  async function togglePairingStatus() {
    setLoadingToggle(true)
    try {
      const res = await fetch('/api/user/toggle-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, enabled: !openForPairing }),
      })
      const data = await res.json()
      setOpenForPairing(data.openForPairing)
    } catch (e) {
      console.error('Failed to toggle pairing:', e)
    } finally {
      setLoadingToggle(false)
    }
  }

  function handleSelfPair() {
    if (!selectedAccount1 || !selectedAccount2) { alert('Please select 2 different accounts'); return }
    if (selectedAccount1.username === selectedAccount2.username) { alert('Please select 2 different usernames'); return }
    setShowDisclaimer(true)
  }

  function handleCrossPair() {
    if (!selectedAccount1 || !selectedOther) { alert('Please select your account and another user\'s account'); return }
    setShowDisclaimer(true)
  }

  async function handleConfirmPair() {
    setShowDisclaimer(false)
    setIsPairing(true)

    const isSelfPair = !!selectedAccount2
    const u1 = selectedAccount1!.username
    const p1 = selectedAccount1!.platform
    const u2 = isSelfPair ? selectedAccount2!.username : selectedOther!.username
    const p2 = isSelfPair ? selectedAccount2!.platform : selectedOther!.platform

    let onchainTokenId: string | undefined
    let onchainTxHash: string | undefined

    try {
      setMintStatus('Opening wallet to mint NFT...')
      if (!window.ethereum) throw new Error('No wallet found')

      const provider = new BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      const contract = new Contract(CONTRACT_ADDRESS, MINT_ABI, signer)

      const tx = await contract.mintPairedUsername(u1, p1, u2, p2)
      setMintStatus('Waiting for onchain confirmation...')
      const receipt = await tx.wait()
      onchainTxHash = receipt.hash

      const iface = contract.interface
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log)
          if (parsed?.name === 'UsernamePaired') {
            onchainTokenId = parsed.args.tokenId.toString()
            break
          }
        } catch {}
      }

      setMintStatus('Minted onchain ✅ Saving to database...')
    } catch (contractError: any) {
      console.error('Contract mint failed:', contractError)
      const msg = contractError.code === 'ACTION_REJECTED'
        ? 'Transaction rejected by user'
        : contractError.message?.includes('already exists')
        ? 'This username pair already exists on-chain'
        : 'Mint failed: ' + (contractError.message || 'Unknown error')
      alert(`❌ ${msg}`)
      setIsPairing(false)
      setMintStatus('')
      return
    }

    try {
      const res = await fetch('/api/pairs/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username1: u1, platform1: p1,
          username2: u2, platform2: p2,
          tokenId: onchainTokenId,
          txHash: onchainTxHash,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save pair')
      }

      const data = await res.json()

      setMintResult({
        pairedName: data.pair.pairedName,
        pairId: data.pair.id,
        tokenId: onchainTokenId,
      })
      setShowPostMintModal(true)
      fetchMyPairs()
      setSelectedAccount1(null)
      setSelectedAccount2(null)
      setSelectedOther(null)
    } catch (dbError: any) {
      console.error('DB save error:', dbError)
      alert(`⚠️ Minted onchain (txHash: ${onchainTxHash}) but failed to save to DB: ${dbError.message}`)
    } finally {
      setIsPairing(false)
      setMintStatus('')
    }
  }

  function handlePostMintTrade() {
    setShowPostMintModal(false)
    if (mintResult?.pairId) router.push(`/pair/${mintResult.pairId}/trade`)
  }

  function handlePostMintWrite() {
    setShowPostMintModal(false)
    router.push('/write')
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Connect Your Wallet</h1>
        <p className="mt-2 text-base text-muted-foreground">
          You need to connect your wallet to pair usernames.
        </p>
        <div className="mt-5"><WalletConnect /></div>
      </div>
    )
  }

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">Pair Usernames</h1>
      <p className="mt-1 text-base text-muted-foreground">
        Combine your usernames into tradeable NFTs on Base
      </p>

      {/* Pairing Toggle */}
      <div className="mt-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Open for Pairing with Others</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow other users to pair with your username
            </p>
          </div>
          <button
            onClick={togglePairingStatus}
            disabled={loadingToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              openForPairing ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              openForPairing ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* My Paired Usernames NFTs */}
      {myPairs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">
            My Paired Usernames
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({myPairs.length} NFT{myPairs.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {myPairs.map((pair) => (
              <div
                key={pair.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-xs font-bold text-primary">NFT</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{pair.pairedName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-primary">
                      {pair.currentPrice.toFixed(2)} USDC
                    </span>
                    {pair.tokenId ? (
                      <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        Onchain #{pair.tokenId}
                      </span>
                    ) : (
                      <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                        Off-chain
                      </span>
                    )}
                    {pair.forSale && (
                      <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">
                        For Sale
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/pair/${pair.id}/trade`)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  Trade <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Verified Accounts */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-foreground mb-1">Your Verified Accounts</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Select any 2 of your usernames to pair — platform doesn't matter
        </p>

        {myAccounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              You haven't published any stories yet.
            </p>
            <button
              onClick={() => router.push('/write')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Verify Account <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {myAccounts.map((account, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!selectedAccount1) {
                    setSelectedAccount1(account)
                    setSelectedOther(null)
                  } else if (!selectedAccount2 && !selectedOther) {
                    if (account.username !== selectedAccount1.username) {
                      setSelectedAccount2(account)
                    } else {
                      alert('Please select a different username')
                    }
                  } else {
                    setSelectedAccount1(account)
                    setSelectedAccount2(null)
                    setSelectedOther(null)
                  }
                }}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  selectedAccount1?.username === account.username ||
                  selectedAccount2?.username === account.username
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {account.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">@{account.username}</p>
                  <p className="text-xs text-muted-foreground">{account.platform}</p>
                </div>
                {(selectedAccount1?.username === account.username ||
                  selectedAccount2?.username === account.username) && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {selectedAccount1?.username === account.username ? '#1' : '#2'}
                  </span>
                )}
                {account.verified && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {myAccounts.length >= 2 && (
          <button
            onClick={handleSelfPair}
            disabled={!selectedAccount1 || !selectedAccount2 || isPairing}
            className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPairing && mintStatus
              ? mintStatus
              : selectedAccount1 && selectedAccount2
              ? `Pair: @${selectedAccount1.username} × @${selectedAccount2.username}`
              : 'Select 2 accounts to pair'}
          </button>
        )}
      </div>

      {/* Pair with Other Users */}
      {myAccounts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Pair with Other Users</h2>
            <button
              onClick={() => setShowAvailable(!showAvailable)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {showAvailable ? 'Hide' : 'Show Available Users'}
            </button>
          </div>

          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                <p className="font-semibold mb-1">Important Notice</p>
                <p>Contact them via DM first. Both users must agree. You are responsible for obtaining consent.</p>
              </div>
            </div>
          </div>

          {showAvailable && (
            <div className="space-y-3 mb-4">
              {availableUsers.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No users currently open for pairing</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Users need to enable "Open for Pairing" toggle on their Pair page
                  </p>
                </div>
              ) : (
                availableUsers.map((user, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedAccount1) {
                        setSelectedOther(user)
                        setSelectedAccount2(null)
                      } else {
                        alert('Please select your account first')
                      }
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all w-full ${
                      selectedOther?.username === user.username
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary shrink-0">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">@{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.platform}</p>
                    </div>
                    {selectedOther?.username === user.username && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded">
                      Open
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Show selected user from Explore even when list is hidden */}
          {selectedOther && !showAvailable && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary shrink-0">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">@{selectedOther.username}</p>
                <p className="text-xs text-muted-foreground">{selectedOther.platform} • Selected from Explore</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            </div>
          )}

          {selectedOther && (
            <button
              onClick={handleCrossPair}
              disabled={!selectedAccount1 || !selectedOther || isPairing}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPairing
                ? mintStatus
                : selectedAccount1
                ? `Pair: @${selectedAccount1.username} × @${selectedOther.username}`
                : `Select your account to pair with @${selectedOther.username}`}
            </button>
          )}
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <DisclaimerModal
          onAccept={handleConfirmPair}
          onCancel={() => setShowDisclaimer(false)}
          isLoading={isPairing}
          disabled={false}
        />
      )}

      {/* Post-Mint Modal */}
      {showPostMintModal && mintResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card border-2 border-primary/30 p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Mint Successful! 🎉</h3>
              {mintResult.tokenId && (
                <p className="text-xs text-muted-foreground mt-1">Onchain Token #{mintResult.tokenId}</p>
              )}
              <div className="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2">
                <p className="text-base font-bold text-primary">{mintResult.pairedName}</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-foreground text-center mb-4">
              What would you like to do with this NFT?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePostMintTrade}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 hover:border-primary hover:bg-primary/10 transition-all"
              >
                <TrendingUp className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Trade</p>
                  <p className="text-xs text-muted-foreground mt-0.5">List as trading asset at 0.7 USDC</p>
                </div>
              </button>
              <button
                onClick={handlePostMintWrite}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-secondary/30 p-4 hover:border-primary/50 hover:bg-secondary/50 transition-all"
              >
                <BookOpen className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Write Story</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Publish the philosophy</p>
                </div>
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              1% platform fee on all trades • Treasury: 0xF349...E84d
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ Default export wraps inner component in Suspense — required for useSearchParams
export default function PairPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PairPageContent />
    </Suspense>
  )
}