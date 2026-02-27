// app/pair/page.tsx - FIXED VERSION
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { ConnectWallet } from "@coinbase/onchainkit/wallet"
import { Sparkles, Link2, Shield, AlertTriangle, Code, TrendingUp } from "lucide-react"
import { DisclaimerModal } from "@/components/disclaimer-modal"

interface UserAccount {
  platform: string
  username: string
  verified: boolean
}

export default function PairPage() {
  const { isConnected, address } = useAccount()
  const router = useRouter()
  
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [selectedAccount1, setSelectedAccount1] = useState<UserAccount | null>(null)
  const [selectedAccount2, setSelectedAccount2] = useState<UserAccount | null>(null)
  const [isPairing, setIsPairing] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [pairedUsername, setPairedUsername] = useState<any>(null)
  const [showOtherUserOption, setShowOtherUserOption] = useState(false)

  // Fetch user's verified accounts
  useEffect(() => {
    if (!address) return
    
    async function fetchUserAccounts() {
      try {
        const response = await fetch(`/api/user/accounts?address=${address}`)
        if (!response.ok) throw new Error('Failed to fetch accounts')
        
        const data = await response.json()
        setUserAccounts(data.accounts || [])
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      }
    }
    
    fetchUserAccounts()
  }, [address])

  const handleSelfPair = () => {
    // VALIDATION FIRST!
    if (!selectedAccount1 || !selectedAccount2) {
      alert('Please select two different accounts to pair')
      return
    }
    
    if (selectedAccount1.platform === selectedAccount2.platform) {
      alert('Please select accounts from different platforms')
      return
    }

    if (!address) {
      alert('Please connect wallet first')
      return
    }
    
    // Show disclaimer
    setShowDisclaimer(true)
  }

  const handleDisclaimerAccept = async () => {
    // CRITICAL: Check again before proceeding
    if (!selectedAccount1 || !selectedAccount2) {
      alert('Please select 2 accounts first!')
      setShowDisclaimer(false)
      return
    }

    if (!address) {
      alert('Please connect wallet first!')
      setShowDisclaimer(false)
      return
    }
    
    setShowDisclaimer(false)
    setIsPairing(true)
    
    try {
      // Call API to mint paired username
      const response = await fetch('/api/pairs/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username1: selectedAccount1.username,
          platform1: selectedAccount1.platform,
          username2: selectedAccount2.username,
          platform2: selectedAccount2.platform,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mint paired username')
      }
      
      const data = await response.json()
      setPairedUsername(data.pair)
      
      alert(`Success! Paired username "${data.pair.pairedName}" minted. You paid the gas fee.`)
    } catch (error: any) {
      console.error('Pairing error:', error)
      alert(error.message || 'Failed to mint pair. Please try again.')
    } finally {
      setIsPairing(false)
    }
  }

  const handleChooseAction = (action: 'write' | 'trade') => {
    if (!pairedUsername) return
    
    if (action === 'write') {
      router.push(`/write?paired=${pairedUsername.pairedName}`)
    } else {
      router.push(`/pair/trade/${pairedUsername.id}`)
    }
  }

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pair Your Usernames</h1>
        <p className="mt-3 text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Connect your wallet, pair your own usernames from Base ecosystem. 
          Use smart contracts to mint your new username into assets and earn from trade 
          OR publish them as your unique philosophical story.
        </p>
        <div className="mt-8">
          <ConnectWallet className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Pair Your Usernames</h1>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">
          Connect your wallet, pair your own usernames from Base ecosystem. 
          Use smart contracts to mint your new username into assets.
        </p>
      </div>

      {/* Info Card */}
      <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Self-Pairing Only
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pair your own verified accounts from different platforms (Base, Farcaster, Zora). 
              You pay gas fees via smart contract. Gasless paymaster only applies to appreciation on stories.
            </p>
          </div>
        </div>
      </div>

      {/* Your Verified Accounts */}
      <div className="mb-8">
        <label className="block text-lg font-bold text-foreground mb-4">
          Your Verified Accounts
        </label>
        
        {userAccounts.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              You need to verify your accounts first.
            </p>
            <button
              onClick={() => router.push('/write')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Verify Your Accounts
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {userAccounts.map((account, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-base font-bold text-foreground">
                    @{account.username}
                  </p>
                  <p className="text-xs text-muted-foreground">{account.platform}</p>
                </div>
                {account.verified && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <Shield className="h-3.5 w-3.5" />
                    Verified
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select Accounts to Pair */}
      {userAccounts.length >= 2 && (
        <>
          <div className="mb-6">
            <label className="block text-lg font-bold text-foreground mb-4">
              Select Two Accounts to Pair
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Account 1 */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Account 1</p>
                <select
                  value={selectedAccount1 ? `${selectedAccount1.platform}-${selectedAccount1.username}` : ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setSelectedAccount1(null)
                      return
                    }
                    const [platform, username] = e.target.value.split('-')
                    const account = userAccounts.find(a => a.platform === platform && a.username === username)
                    setSelectedAccount1(account || null)
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select account</option>
                  {userAccounts.map((account, idx) => (
                    <option 
                      key={idx} 
                      value={`${account.platform}-${account.username}`}
                      disabled={selectedAccount2?.username === account.username && selectedAccount2?.platform === account.platform}
                    >
                      {account.username} ({account.platform})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account 2 */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Account 2</p>
                <select
                  value={selectedAccount2 ? `${selectedAccount2.platform}-${selectedAccount2.username}` : ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setSelectedAccount2(null)
                      return
                    }
                    const [platform, username] = e.target.value.split('-')
                    const account = userAccounts.find(a => a.platform === platform && a.username === username)
                    setSelectedAccount2(account || null)
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select account</option>
                  {userAccounts.map((account, idx) => (
                    <option 
                      key={idx} 
                      value={`${account.platform}-${account.username}`}
                      disabled={selectedAccount1?.username === account.username && selectedAccount1?.platform === account.platform}
                    >
                      {account.username} ({account.platform})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pair Preview */}
          {selectedAccount1 && selectedAccount2 && !pairedUsername && (
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6 mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">Paired Username Preview</p>
                <div className="inline-block rounded-full bg-primary/20 px-6 py-3">
                  <span className="text-2xl font-bold text-primary">
                    {selectedAccount1.username}×{selectedAccount2.username}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-accent/50 p-4 mb-4 flex items-start gap-3">
                <Code className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Smart Contract Minting</p>
                  <p>You will pay gas fees to mint this paired username as an on-chain asset. 
                  This is NOT covered by gasless paymaster.</p>
                </div>
              </div>

              <button
                onClick={handleSelfPair}
                disabled={isPairing}
                className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPairing ? 'Minting...' : 'Mint Paired Username'}
              </button>
            </div>
          )}

          {/* After Pairing Success */}
          {pairedUsername && (
            <div className="rounded-xl border-2 border-green-500/30 bg-green-500/5 p-6 mb-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Paired Username Minted Successfully!
                  </p>
                </div>
                <div className="inline-block rounded-full bg-primary/20 px-6 py-3 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {pairedUsername.pairedName}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Starting price: <span className="font-semibold text-foreground">0.7 USDC</span>
                </p>
              </div>

              <p className="text-sm font-medium text-foreground mb-3 text-center">
                What would you like to do with this paired username?
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChooseAction('write')}
                  className="rounded-xl border-2 border-primary bg-card py-4 px-4 text-center hover:bg-primary/10 transition-colors"
                >
                  <div className="text-primary mb-1">
                    <Sparkles className="h-6 w-6 mx-auto" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Write & Publish</p>
                  <p className="text-xs text-muted-foreground mt-1">Share your story</p>
                </button>
                <button
                  onClick={() => handleChooseAction('trade')}
                  className="rounded-xl bg-primary py-4 px-4 text-center hover:bg-primary/90 transition-colors"
                >
                  <div className="text-primary-foreground mb-1">
                    <TrendingUp className="h-6 w-6 mx-auto" />
                  </div>
                  <p className="text-sm font-semibold text-primary-foreground">Trade Username</p>
                  <p className="text-xs text-primary-foreground/80 mt-1">List as asset</p>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Optional: Pair with Another User */}
      <div className="mt-8 pt-8 border-t border-border">
        <button
          onClick={() => setShowOtherUserOption(!showOtherUserOption)}
          className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Want to pair with another user's username?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact them via DM or private chat first
                </p>
              </div>
            </div>
            <span className="text-sm text-primary">
              {showOtherUserOption ? 'Hide' : 'Show'}
            </span>
          </div>
        </button>

        {showOtherUserOption && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Important Notice</p>
                <p>Both users must agree and confirm the pairing. 
                Names app does not facilitate communication or permission management. 
                You are responsible for obtaining consent.</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDisclaimer(true)}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Read Disclaimer & Continue
            </button>
          </div>
        )}
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <DisclaimerModal
          onAccept={handleDisclaimerAccept}
          onCancel={() => setShowDisclaimer(false)}
          isLoading={isPairing}
          disabled={!selectedAccount1 || !selectedAccount2}
        />
      )}
    </div>
  )
}