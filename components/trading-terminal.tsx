"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"

// Import smart contract config
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT!
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Contract ABIs
const CONTRACT_ABI = [
  'function buyPairedUsername(uint256 tokenId) external',
  'function listForSale(uint256 tokenId, uint256 price) external',
  'function getPairedUsername(uint256 tokenId) view returns (tuple(string username1, string platform1, string username2, string platform2, string pairedName, address creator, uint256 currentPrice, uint256 totalVolume, bool forSale, uint256 timestamp))',
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
  tokenId: string // ADD THIS: NFT token ID from smart contract
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
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [highPrice, setHighPrice] = useState(currentPrice)
  const [lowPrice, setLowPrice] = useState(currentPrice)
  const [showOrderBook, setShowOrderBook] = useState(false)
  const [txStatus, setTxStatus] = useState<string>('')

  // Fetch recent trades
  useEffect(() => {
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
    
    fetchTrades()
    const interval = setInterval(fetchTrades, 10000)
    return () => clearInterval(interval)
  }, [pairId])

  const handleBuy = async () => {
    if (!address) {
      alert('Please connect wallet first')
      return
    }

    const tradePrice = parseFloat(price)
    if (isNaN(tradePrice) || tradePrice < 0.7) {
      alert('Price must be at least 0.7 USDC')
      return
    }

    setIsTrading(true)
    setTxStatus('Preparing transaction...')

    try {
      // Get provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      // Convert price to USDC wei (6 decimals)
      const priceInWei = ethers.utils.parseUnits(tradePrice.toString(), 6)

      // 1. Approve USDC spending
      setTxStatus('Approving USDC...')
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
      
      // Check current allowance
      const allowance = await usdcContract.allowance(address, CONTRACT_ADDRESS)
      
      if (allowance.lt(priceInWei)) {
        const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, priceInWei)
        setTxStatus('Waiting for approval confirmation...')
        await approveTx.wait()
      }

      // 2. Buy the username
      setTxStatus('Buying username...')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const buyTx = await contract.buyPairedUsername(tokenId)
      
      setTxStatus('Waiting for transaction confirmation...')
      const receipt = await buyTx.wait()

      // 3. Record trade in database
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

      setTxStatus('Success!')
      alert(`Successfully bought ${pairedUsername} for ${tradePrice} USDC!`)
      
      // Refresh page
      setTimeout(() => router.refresh(), 2000)

    } catch (error: any) {
      console.error('Buy error:', error)
      
      let errorMsg = 'Failed to buy username'
      if (error.code === 'ACTION_REJECTED') {
        errorMsg = 'Transaction rejected by user'
      } else if (error.message?.includes('insufficient')) {
        errorMsg = 'Insufficient USDC balance'
      }
      
      alert(errorMsg)
      setTxStatus('')
    } finally {
      setIsTrading(false)
    }
  }

  const handleSell = async () => {
    if (!address) {
      alert('Please connect wallet first')
      return
    }

    const tradePrice = parseFloat(price)
    if (isNaN(tradePrice) || tradePrice < 0.7) {
      alert('Price must be at least 0.7 USDC')
      return
    }

    setIsTrading(true)
    setTxStatus('Preparing listing...')

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      // Convert price to wei (6 decimals for USDC)
      const priceInWei = ethers.utils.parseUnits(tradePrice.toString(), 6)

      // List for sale
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const listTx = await contract.listForSale(tokenId, priceInWei)
      
      setTxStatus('Waiting for confirmation...')
      const receipt = await listTx.wait()

      // Record in database
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

      setTxStatus('Success!')
      alert(`Successfully listed ${pairedUsername} for ${tradePrice} USDC!`)
      
      setTimeout(() => router.refresh(), 2000)

    } catch (error: any) {
      console.error('Sell error:', error)
      
      let errorMsg = 'Failed to list username'
      if (error.code === 'ACTION_REJECTED') {
        errorMsg = 'Transaction rejected by user'
      }
      
      alert(errorMsg)
      setTxStatus('')
    } finally {
      setIsTrading(false)
    }
  }

  const handleTrade = () => {
    if (orderType === 'buy') {
      handleBuy()
    } else {
      handleSell()
    }
  }

  const tradingPair = `${username1}/${username2}`
  const priceChange = currentPrice - 0.7
  const priceChangePercent = ((priceChange / 0.7) * 100).toFixed(2)

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card overflow-hidden">
      {/* Terminal Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-bold text-foreground">{tradingPair}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trading Username: {pairedUsername}
            </p>
          </div>
          <button
            onClick={() => router.push('/pair')}
            className="text-muted-foreground hover:text-foreground"
          >
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

      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Order Panel */}
        <div className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Place Order
          </h4>

          {/* Buy/Sell Toggle */}
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

          {/* Price Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Price (USDC)
            </label>
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

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Amount
            </label>
            <input
              type="number"
              step="1"
              min="1"
              defaultValue="1"
              disabled
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base font-mono text-foreground outline-none opacity-50"
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Fixed at 1 share per transaction
            </p>
          </div>

          {/* Total Calculation */}
          <div className="rounded-lg bg-secondary/50 p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">{parseFloat(price || '0').toFixed(2)} USDC</span>
            </div>
          </div>

          {/* Transaction Status */}
          {txStatus && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 mb-4">
              <p className="text-sm text-blue-400 text-center">{txStatus}</p>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleTrade}
            disabled={isTrading || !price || parseFloat(price) < 0.7 || !address}
            className={`w-full rounded-lg py-3.5 font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              orderType === 'buy'
                ? 'bg-green-500 hover:bg-green-600 active:scale-95'
                : 'bg-red-500 hover:bg-red-600 active:scale-95'
            }`}
          >
            {!address ? (
              'Connect Wallet First'
            ) : isTrading ? (
              'Processing...'
            ) : (
              <>
                {orderType === 'buy' ? 'Buy' : 'Sell'} {tradingPair}
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            ⚠️ Trading requires wallet approval & gas fees
          </p>
        </div>

        {/* Recent Trades - SAMA SEPERTI SEBELUMNYA */}
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
                <div
                  key={trade.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/30 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    {trade.type === 'buy' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${
                        trade.type === 'buy' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {trade.type.toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.from.slice(0, 6)}...{trade.from.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {trade.price.toFixed(2)} USDC
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trade.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trading Info */}
          <div className="mt-4 rounded-lg border border-border bg-accent/40 p-3">
            <p className="text-xs font-medium text-foreground mb-2">📊 Trading Info</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Asset Type:</span>
                <span className="font-medium text-foreground">Paired Username NFT</span>
              </div>
              <div className="flex justify-between">
                <span>Token ID:</span>
                <span className="font-medium text-foreground">#{tokenId}</span>
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