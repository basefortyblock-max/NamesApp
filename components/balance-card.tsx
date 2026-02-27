// components/balance-card.tsx - UPDATED VERSION
"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ArrowUpRight, ArrowDownLeft, Wallet, X, Copy, Check } from "lucide-react"

export function BalanceCard() {
  const { isConnected, address } = useAccount()
  const [balance, setBalance] = useState(0)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch balance
  useEffect(() => {
    if (!address) return
    
    async function fetchBalance() {
      try {
        const response = await fetch(`/api/wallet/balance?address=${address}`)
        const data = await response.json()
        setBalance(data.balance || 0)
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }
    
    fetchBalance()
    
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [address])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    
    if (isNaN(amount) || amount < 1) {
      alert('Minimum withdrawal amount is $1')
      return
    }
    
    if (amount > balance) {
      alert('Insufficient balance')
      return
    }
    
    setIsWithdrawing(true)
    
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          amount,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Withdrawal failed')
      }
      
      // Update balance
      setBalance(balance - amount)
      setWithdrawAmount("")
      setShowWithdrawModal(false)
      alert('Withdrawal request submitted successfully!')
    } catch (error) {
      console.error('Withdrawal error:', error)
      alert('Failed to process withdrawal. Please try again.')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isConnected || !address) return null

  return (
    <>
      <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-primary p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-primary-foreground/70">Your Balance</p>
            <p className="mt-1 text-2xl font-bold">
              ${balance.toFixed(2)} <span className="text-sm font-normal text-primary-foreground/80">USDC</span>
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-2 text-xs text-primary-foreground/60">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <div className="mt-3 flex gap-2">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance < 1}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-primary-foreground/25 disabled:opacity-40"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Withdraw
          </button>
          <button 
            onClick={() => setShowReceiveModal(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-2 text-xs font-semibold transition-colors hover:bg-primary-foreground/25"
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Receive
          </button>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Withdraw Funds</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Available balance: <span className="font-semibold text-foreground">${balance.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Minimum withdrawal: $1.00 USDC
              </p>

              <label className="mb-2 block text-sm font-medium text-foreground">
                Amount (USDC)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
                className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) < 1}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Receive USDC</h2>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Send USDC (Base network) to this address:
              </p>

              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Your Wallet Address</p>
                <p className="text-sm font-mono text-foreground break-all">
                  {address}
                </p>
              </div>

              <button
                onClick={handleCopyAddress}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Address
                  </>
                )}
              </button>
            </div>

            <div className="rounded-lg bg-accent/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">⚠️ Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only send USDC on Base network</li>
                <li>Sending other tokens may result in loss</li>
                <li>Allow a few minutes for confirmation</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}