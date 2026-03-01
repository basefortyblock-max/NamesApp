"use client"

import { useState, useEffect } from "react"
import { useAccount, useSignMessage } from "wagmi"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { Wallet, CheckCircle2, AlertCircle, Loader2, Shield, Users, ArrowRight, X } from "lucide-react"
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

export default function PairPage() {
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  // User's own accounts
  const [myAccounts, setMyAccounts] = useState<UserAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  
  // Available users for pairing
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [showAvailable, setShowAvailable] = useState(false)
  
  // Pairing settings
  const [openForPairing, setOpenForPairing] = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)
  
  // Self-pairing
  const [selectedAccount1, setSelectedAccount1] = useState<UserAccount | null>(null)
  const [selectedAccount2, setSelectedAccount2] = useState<UserAccount | null>(null)
  
  // Cross-pairing
  const [selectedOther, setSelectedOther] = useState<AvailableUser | null>(null)
  
  // UI states
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [isPairing, setIsPairing] = useState(false)

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
      
      // Filter out current user and only show users open for pairing
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
      alert(data.openForPairing ? '✅ You are now open for pairing!' : '❌ Pairing disabled')
    } catch (error) {
      alert('Failed to update pairing status')
    } finally {
      setLoadingToggle(false)
    }
  }

  function handleSelfPair() {
    if (!selectedAccount1 || !selectedAccount2) {
      alert('Please select 2 different accounts')
      return
    }
    
    if (selectedAccount1.platform === selectedAccount2.platform) {
      alert('Please select accounts from different platforms')
      return
    }
    
    setShowDisclaimer(true)
  }

  function handleCrossPair() {
    if (!selectedAccount1 || !selectedOther) {
      alert('Please select your account and another user\'s account')
      return
    }
    
    if (selectedAccount1.platform === selectedOther.platform) {
      alert('Please select accounts from different platforms')
      return
    }
    
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
      alert(`✅ Success! Paired username "${data.pair.pairedName}" minted!`)
      
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
          <ConnectWalletButton className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90" />
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
        <h2 className="text-lg font-bold text-foreground mb-3">Your Verified Accounts</h2>
        
        {myAccounts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              You haven't published any stories yet. Verify and publish your first username to start pairing.
            </p>
            <button
              onClick={() => window.location.href = '/write'}
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
                    if (account.platform !== selectedAccount1.platform) {
                      setSelectedAccount2(account)
                    } else {
                      alert('Please select accounts from different platforms')
                    }
                  } else {
                    // Reset
                    setSelectedAccount1(account)
                    setSelectedAccount2(null)
                    setSelectedOther(null)
                  }
                }}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  selectedAccount1?.username === account.username
                    ? 'border-primary bg-primary/10'
                    : selectedAccount2?.username === account.username
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
            Pair My Accounts ({selectedAccount1?.username || '?'} × {selectedAccount2?.username || '?'})
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
                        if (user.platform !== selectedAccount1.platform) {
                          setSelectedOther(user)
                          setSelectedAccount2(null)
                        } else {
                          alert('Please select accounts from different platforms')
                        }
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

          {/* Cross-Pair Button */}
          {selectedOther && (
            <button
              onClick={handleCrossPair}
              disabled={!selectedAccount1 || !selectedOther}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Pair Accounts ({selectedAccount1?.username || '?'} × {selectedOther?.username || '?'})
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
    </div>
  )
}
