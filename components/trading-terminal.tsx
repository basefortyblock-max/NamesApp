"use client"

/**
 * components/trading-terminal.tsx
 *
 * FIXES:
 * - ethers v6: replaced allowance.lt() with native BigInt < comparison
 * - ethers v6: replaced allowance.lt with BigInt arithmetic throughout
 * - Added "List for Sale" button for NFT owner — NFT must be listed before it can be bought
 * - Buy now checks forSale status before attempting onchain call
 * - Sell flow now also calls listForSale correctly
 */

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, X, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { BrowserProvider, Contract, parseUnits } from "ethers"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT!
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const CONTRACT_ABI = [
  'function buyPairedUsername(uint256 tokenId) external',
  'function listForSale(uint256 tokenId, uint256 price) external',
  'function getPairedUsername(uint256 tokenId) view returns (tuple(string username1, string platform1, string username2, string platform2, string pairedName, address creator, uint256 currentPrice, uint256 totalVolume, bool forSale, uint256 timestamp))',
  'function ownerOf(uint256 tokenId) view returns (address)',
]

const USDC_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]

interface TradingTerminalProps {
  pairedUsername: string
  username1: string
  username2: string
  currentPrice: number
  pairId: string
  tokenId: string
}

interface Trade {
  id: string
  type: 'buy' | 'sell'
  price: number
  from: string
  createdAt: string
}

export function TradingTerminal({
  pairedUsername,
  username1,
  username2,
  currentPrice,
  pairId,
  tokenId,
}: TradingTerminalProps) {
  const { address } = useAccount()
  const router = useRouter()

  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [price, setPrice] = useState(currentPrice.toString())
  const [isTrading, setIsTrading] = useState(false)
  const [isListing, setIsListing] = useState(false)
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [highPrice, setHighPrice] = useState(currentPrice)
  const [lowPrice, setLowPrice] = useState(currentPrice)
  const [txStatus, setTxStatus] = useState<string>('')
  const [isForSale, setIsForSale] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchTrades()
    checkOnchainStatus()
    const interval = setInterval(fetchTrades, 10000)
    return () => clearInterval(interval)
  }, [pairId])

  async function fetchTrades() {
    try {
      const response = await fetch(`/api/pairs/${pairId}/trade`)
      const data = await response.json()
      if (data.trades) {
        setRecentTrades(data.trades.slice(0, 5))
        const prices = data.trades.map((t: Trade) => t.price)
        if (prices.length > 0) {
          setHighPrice(Math.max(...prices))
          setLowPrice(Math.min(...prices))
        }
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    }
  }

  async function checkOnchainStatus() {
    if (!address || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return
    try {
      const provider = new BrowserProvider(window.ethereum as any)
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      // tokenId from DB (cuid) may not map to onchain tokenId
      // Only check if tokenId is numeric
      const numericId = parseInt(tokenId)
      if (isNaN(numericId)) return
      const data = await contract.getPairedUsername(numericId)
      setIsForSale(data.forSale)
      const owner = await contract.ownerOf(numericId)
      setIsOwner(owner.toLowerCase() === address.toLowerCase())
    } catch {
      // Contract not deployed or token doesn't exist onchain yet — silent fail
    }
  }

  const handleListForSale = async () => {
    if (!address) { alert('Please connect wallet first'); return }
    const listPrice = parseFloat(price)
    if (isNaN(listPrice) || listPrice < 0.7) { alert('Price must be at least 0.7 USDC'); return }

    setIsListing(true)
    setTxStatus('Listing for sale...')
    try {
      const provider = new BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      const priceInWei = parseUnits(listPrice.toString(), 6)
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const numericId = parseInt(tokenId)
      if (isNaN(numericId)) throw new Error('Invalid token ID — token may not be minted onchain yet')
      const tx = await contract.listForSale(numericId, priceInWei)
      setTxStatus('Waiting for confirmation...')
      await tx.wait()

      await fetch(`/api/pairs/${pairId}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: address, type: 'list', price: listPrice, txHash: tx.hash }),
      })

      setIsForSale(true)
      setTxStatus('')
      alert(`Listed ${pairedUsername} for ${listPrice} USDC!`)
    } catch (error: any) {
      alert(error.code === 'ACTION_REJECTED' ? 'Transaction rejected' : error.message || 'Failed to list')
      setTxStatus('')
    } finally {
      setIsListing(false)
    }
  }

  const handleBuy = async () => {
    if (!address) { alert('Please connect wallet first'); return }
    if (!isForSale) { alert('This username is not listed for sale yet. Owner must list it first.'); return }

    const tradePrice = parseFloat(price)
    if (isNaN(tradePrice) || tradePrice < 0.7) { alert('Price must be at least 0.7 USDC'); return }

    setIsTrading(true)
    setTxStatus('Preparing transaction...')
    try {
      const provider = new BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      const priceInWei = parseUnits(tradePrice.toString(), 6)

      // ✅ ethers v6: allowance returns native BigInt, use < not .lt()
      setTxStatus('Approving USDC...')
      const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, signer)
      const allowance: bigint = await usdcContract.allowance(address, CONTRACT_ADDRESS)

      if (allowance < priceInWei) {
        const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, priceInWei)
        setTxStatus('Waiting for approval confirmation...')
        await approveTx.wait()
      }

      setTxStatus('Buying username...')
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const numericId = parseInt(tokenId)
      if (isNaN(numericId)) throw new Error('Invalid token ID')
      const buyTx = await contract.buyPairedUsername(numericId)

      setTxStatus('Waiting for transaction confirmation...')
      const receipt = await buyTx.wait()

      await fetch(`/api/pairs/${pairId}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          type: 'buy',
          price: tradePrice,
          txHash: receipt.transactionHash,
        }),
      })

      setTxStatus('')
      setIsForSale(false)
      setIsOwner(true)
      alert(`Successfully bought ${pairedUsername} for ${tradePrice} USDC!`)
      setTimeout(() => router.refresh(), 2000)
    } catch (error: any) {
      const msg = error.code === 'ACTION_REJECTED' ? 'Transaction rejected'
        : error.message?.includes('insufficient') ? 'Insufficient USDC balance'
        : error.message?.includes('Not for sale') ? 'This username is not listed for sale'
        : 'Failed to buy username'
      alert(msg)
      setTxStatus('')
    } finally {
      setIsTrading(false)
    }
  }

  const handleSell = async () => {
    if (!address) { alert('Please connect wallet first'); return }
    const tradePrice = parseFloat(price)
    if (isNaN(tradePrice) || tradePrice < 0.7) { alert('Price must be at least 0.7 USDC'); return }

    setIsTrading(true)
    setTxStatus('Preparing listing...')
    try {
      const provider = new BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()
      const priceInWei = parseUnits(tradePrice.toString(), 6)
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const numericId = parseInt(tokenId)
      if (isNaN(numericId)) throw new Error('Invalid token ID')
      const listTx = await contract.listForSale(numericId, priceInWei)

      setTxStatus('Waiting for confirmation...')
      const receipt = await listTx.wait()

      await fetch(`/api/pairs/${pairId}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          type: 'sell',
          price: tradePrice,
          txHash: receipt.transactionHash,
        }),
      })

      setTxStatus('')
      setIsForSale(true)
      alert(`Listed ${pairedUsername} for ${tradePrice} USDC!`)
      setTimeout(() => router.refresh(), 2000)
    } catch (error: any) {
      alert(error.code === 'ACTION_REJECTED' ? 'Transaction rejected' : 'Failed to list username')
      setTxStatus('')
    } finally {
      setIsTrading(false)
    }
  }

  const handleTrade = () => orderType === 'buy' ? handleBuy() : handleSell()

  const tradingPair = `${username1}/${username2}`
  const priceChange = currentPrice - 0.7
  const priceChangePercent = ((priceChange / 0.7) * 100).toFixed(2)

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-bold text-foreground">{tradingPair}</h3>
              {isForSale && (
                <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">
                  For Sale
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trading Username: {pairedUsername}
            </p>
          </div>
          <button onClick={() => router.push('/pair')} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-border bg-secondary/30">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Current Price</p>
          <p className="text-lg font-bold text-foreground">{currentPrice.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h Change</p>
          <p className={`text-lg font-bold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
          </p>
          <p className={`text-xs ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChangePercent}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h High</p>
          <p className="text-lg font-bold text-foreground">{highPrice.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">24h Low</p>
          <p className="text-lg font-bold text-foreground">{lowPrice.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
      </div>

      {/* Owner: List for Sale notice */}
      {isOwner && !isForSale && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            You own this NFT. List it for sale so others can buy it.
          </p>
          <button
            onClick={handleListForSale}
            disabled={isListing}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 shrink-0"
          >
            <Tag className="h-3.5 w-3.5" />
            {isListing ? 'Listing...' : 'List for Sale'}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Order Panel */}
        <div className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Place Order
          </h4>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setOrderType('buy')}
              className={`rounded-lg py-2.5 font-semibold transition-all ${
                orderType === 'buy'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              <TrendingUp className="inline h-4 w-4 mr-1.5" />
              Buy
            </button>
            <button
              onClick={() => setOrderType('sell')}
              className={`rounded-lg py-2.5 font-semibold transition-all ${
                orderType === 'sell'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              <TrendingDown className="inline h-4 w-4 mr-1.5" />
              Sell
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Price (USDC)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.7"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-16 text-base font-mono text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="0.70"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                USDC
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Min: 0.7 USDC • Market: {currentPrice.toFixed(2)} USDC
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Amount</label>
            <input
              type="number"
              defaultValue="1"
              disabled
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-mono text-foreground outline-none opacity-50"
            />
            <p className="text-xs text-muted-foreground mt-1">Fixed at 1 share per transaction</p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">{parseFloat(price || '0').toFixed(2)} USDC</span>
            </div>
          </div>

          {txStatus && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 mb-4">
              <p className="text-sm text-blue-400 text-center">{txStatus}</p>
            </div>
          )}

          {orderType === 'buy' && !isForSale && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 mb-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                ⚠️ Not listed for sale yet — owner must list it first
              </p>
            </div>
          )}

          <button
            onClick={handleTrade}
            disabled={isTrading || !price || parseFloat(price) < 0.7 || !address || (orderType === 'buy' && !isForSale)}
            className={`w-full rounded-lg py-3.5 font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              orderType === 'buy'
                ? 'bg-green-500 hover:bg-green-600 active:scale-95'
                : 'bg-red-500 hover:bg-red-600 active:scale-95'
            }`}
          >
            {!address ? 'Connect Wallet First'
              : isTrading ? 'Processing...'
              : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${tradingPair}`}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            ⚠️ Trading requires wallet approval & gas fees
          </p>
        </div>

        {/* Recent Trades */}
        <div className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Recent Trades
          </h4>

          {recentTrades.length === 0 ? (
            <div className="rounded-lg bg-secondary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">No trades yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to trade!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-2.5">
                  <div className="flex items-center gap-2">
                    {trade.type === 'buy'
                      ? <TrendingUp className="h-4 w-4 text-green-500" />
                      : <TrendingDown className="h-4 w-4 text-red-500" />}
                    <div>
                      <p className={`text-sm font-bold ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.type.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.from.slice(0, 6)}...{trade.from.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{trade.price.toFixed(2)} USDC</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trade.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-border bg-accent/40 p-3">
            <p className="text-xs font-medium text-foreground mb-2">📊 Trading Info</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Asset Type:</span>
                <span className="font-medium text-foreground">Paired Username NFT</span>
              </div>
              <div className="flex justify-between">
                <span>Token ID:</span>
                <span className="font-medium text-foreground">#{tokenId.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Starting Price:</span>
                <span className="font-medium text-foreground">0.7 USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="font-medium text-foreground">Base</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span className="font-medium text-foreground">1% (to treasury)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}