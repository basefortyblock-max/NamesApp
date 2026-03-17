"use client"

/**
 * app/pair/page.tsx
 *
 * FIXES:
 * - Removed platform check for self-pair — user can pair any 2 of their
 *   own usernames regardless of platform, as long as they are different
 * - Removed platform check for cross-pair — same logic applies
 * - Added post-mint modal with 2 options: "Trade" or "Write Story"
 * - Post-mint modal shows paired username and routes accordingly
 */

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { WalletConnect } from "@/components/connect-wallet-button"
import {
  Wallet, CheckCircle2, AlertCircle, Loader2,
  Shield, Users, ArrowRight, TrendingUp, BookOpen
} from "lucide-react"
import { DisclaimerModal } from "@/components/disclaimer-modal"

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

export default function PairPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

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

  // Post-mint modal
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [showPostMintModal, setShowPostMintModal] = useState(false)

  useEffect(() => {
    if (address) {
      fetchMyAccounts()
      fetchPairingStatus()
    }
  }, [address])

  useEffect(() => {
    if (showAvailable) {
      fetchAvailableUsers()
    }
  }, [showAvailable])

  async function fetchMyAccounts() {
    try {
      const response = await fetch(`/api/user/stories?address=${address}`)
      const data = await response.json()
      const accounts = data.stories?.map((s: any) => ({
        username: s.username,
        platform: s.platform,
        verified: s.verified,
      })) || []
      setMyAccounts(accounts)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  async function fetchPairingStatus() {
    try {
      const response = await fetch(`/api/user/toggle-pairing?address=${address}`)
      const data = await response.json()
      setOpenForPairing(data.openForPairing || false)
    } catch (error) {
      console.error('Failed to fetch pairing status:', error)
    }
  }

  async function fetchAvailableUsers() {
    try {
      const response = await fetch('/api/users/available')
      const data = await response.json()
      const filtered = data.users?.filter((u: AvailableUser) =>
        u.address !== address && u.openForPairing
      ) || []
      setAvailableUsers(filtered)
    } catch (error) {
      console.error('Failed to fetch available users:', error)
    }
  }

  async function togglePairingStatus() {
    setLoadingToggle(true)
    try {
      const response = await fetch('/api/user/toggle-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, enabled: !openForPairing }),
      })
      const data = await response.json()
      setOpenForPairing(data.openForPairing)
    } catch (error) {
      console.error('Failed to update pairing status:', error)
    } finally {
      setLoadingToggle(false)
    }
  }

  function handleSelfPair() {
    if (!selectedAccount1 || !selectedAccount2) {
      alert('Please select 2 different accounts')
      return
    }
    // ✅ Removed platform check — any 2 different usernames can be paired
    if (selectedAccount1.username === selectedAccount2.username) {
      alert('Please select 2 different usernames')
      return
    }
    setShowDisclaimer(true)
  }

  function handleCrossPair() {
    if (!selectedAccount1 || !selectedOther) {
      alert('Please select your account and another user\'s account')
      return
    }
    // ✅ Removed platform check — pairing is based on username, not platform
    setShowDisclaimer(true)
  }

  async function handleConfirmPair() {
    setShowDisclaimer(false)
    setIsPairing(true)

    try {
      const isSelfPair = !!selectedAccount2

      const response = await fetch('/api/pairs/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username1: selectedAccount1!.username,
          platform1: selectedAccount1!.platform,
          username2: isSelfPair ? selectedAccount2!.username : selectedOther!.username,
          platform2: isSelfPair ? selectedAccount2!.platform : selectedOther!.platform,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mint')
      }

      const data = await response.json()

      // ✅ Show post-mint modal instead of alert
      setMintResult({
        pairedName: data.pair.pairedName,
        pairId: data.pair.id,
        tokenId: data.pair.tokenId,
      })
      setShowPostMintModal(true)

      // Reset selections
      setSelectedAccount1(null)
      setSelectedAccount2(null)
      setSelectedOther(null)
    } catch (error: any) {
      console.error('Pairing error:', error)
      alert(`❌ ${error.message}`)
    } finally {
      setIsPairing(false)
    }
  }

  function handlePostMintTrade() {
    setShowPostMintModal(false)
    if (mintResult?.pairId) {
      router.push(`/pair/${mintResult.pairId}/trade`)
    }
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
        <div className="mt-5">
          <WalletConnect />
        </div>
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
        Combine your usernames into tradeable NFTs
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
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                openForPairing ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Section 1: Your Accounts */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-foreground mb-1">Your Verified Accounts</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Select any 2 of your usernames to pair — platform doesn't matter
        </p>

        {myAccounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              You haven't published any stories yet. Publish your first username to start pairing.
            </p>
            <button
              onClick={() => router.push('/write')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Verify Account
              <ArrowRight className="h-4 w-4" />
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
                    // ✅ Only check username, not platform
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

        {/* Self-Pair Button */}
        {myAccounts.length >= 2 && (
          <button
            onClick={handleSelfPair}
            disabled={!selectedAccount1 || !selectedAccount2}
            className="mt-4 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedAccount1 && selectedAccount2
              ? `Pair: @${selectedAccount1.username} × @${selectedAccount2.username}`
              : 'Select 2 accounts to pair'}
          </button>
        )}
      </div>

      {/* Section 2: Pair with Others */}
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
                <p>Contact them via DM or private chat first. Both users must agree and confirm the pairing. You are responsible for obtaining consent.</p>
              </div>
            </div>
          </div>

          {showAvailable && (
            <div className="space-y-3 mb-4">
              {availableUsers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No users currently open for pairing
                </p>
              ) : (
                availableUsers.map((user, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedAccount1) {
                        // ✅ No platform check — just make sure not same username
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
                    <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded">
                      Open
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {selectedOther && (
            <button
              onClick={handleCrossPair}
              disabled={!selectedAccount1 || !selectedOther}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Pair: @{selectedAccount1?.username || '?'} × @{selectedOther.username}
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

      {/* ✅ Post-Mint Modal — Trade or Write Story */}
      {showPostMintModal && mintResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-card border-2 border-primary/30 p-6">
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Mint Successful! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Username NFT created
              </p>
              <div className="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2">
                <p className="text-base font-bold text-primary">
                  {mintResult.pairedName}
                </p>
              </div>
            </div>

            {/* What's next */}
            <p className="text-sm font-semibold text-foreground text-center mb-4">
              What would you like to do with this NFT?
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Trade */}
              <button
                onClick={handlePostMintTrade}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 hover:border-primary hover:bg-primary/10 transition-all"
              >
                <TrendingUp className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Trade</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    List as trading asset at 0.7 USDC base price
                  </p>
                </div>
              </button>

              {/* Option 2: Write Story */}
              <button
                onClick={handlePostMintWrite}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-secondary/30 p-4 hover:border-primary/50 hover:bg-secondary/50 transition-all"
              >
                <BookOpen className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Write Story</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Publish the philosophy behind this username
                  </p>
                </div>
              </button>
            </div>

            {/* Fee info */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              1% platform fee applies on all trades • Treasury: {`0xF349...E84d`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}