"use client"

/**
 * components/trading-terminal.tsx
 *
 * ONCHAIN UPGRADE:
 * - handleListForSale/handleSell: calls contract.listForSale(tokenId, priceInWei)
 * - handleBuy: approve USDC → contract.buyPairedUsername(tokenId)
 * - Falls back to DB-only if tokenId is null/undefined (legacy off-chain records)
 * - ownerAddress updated in DB after successful buy via PATCH /api/pairs/[id]
 * - ethers v6: BigInt comparison, no .lt()
 */

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, X, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { BrowserProvider, Contract, parseUnits } from "ethers"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT!
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

const CONTRACT_ABI = [
  'function listForSale(uint256 tokenId, uint256 price) external',
  'function buyPairedUsername(uint256 tokenId) external',
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
  tokenId: string       // DB cuid — used to hit API
  onchainTokenId?: number | null  // uint256 from contract — used for contract calls
  creator?: string
}

interface Trade {
  id: string
  type: string
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
  onchainTokenId,
  creator,
}: TradingTerminalProps) {
  const { address } = useAccount()
  const router = useRouter()

  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy')
  const [price, setPrice] = useState(currentPrice.toString())
  const [isTrading, setIsTrading] = useState(false)
  const [txStatus, setTxStatus] = useState<string>('')
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [highPrice, setHighPrice] = useState(currentPrice)
  const [lowPrice, setLowPrice] = useState(currentPrice)
  const [isForSale, setIsForSale] = useState(false)
  const [currentOwner, setCurrentOwner] = useState<string>(creator || '')

  const isOwner = address?.toLowerCase() === currentOwner?.toLowerCase()
  const isOnchain = !!onchainTokenId // true = real NFT exists on Base

  useEffect(() => {
    fetchPairStatus()
    fetchTrades()
    const interval = setInterval(fetchTrades, 10000)
    return () => clearInterval(interval)
  }, [pairId])

  async function fetchPairStatus() {
    try {
      const res = await fetch(`/api/pairs/${pairId}`)
      const data = await res.json()
      if (data.pair) {
        setIsForSale(data.pair.forSale)
        setCurrentOwner(data.pair.ownerAddress || data.pair.creator)
      }
    } catch (e) {
      console.error('fetchPairStatus error:', e)
    }
  }

  async function fetchTrades() {
    try {
      const res = await fetch(`/api/pairs/${pairId}/trade`)
      const data = await res.json()
      if (data.trades) {
        setRecentTrades(data.trades.slice(0, 5))
        const prices = data.trades.map((t: Trade) => t.price)
        if (prices.length > 0) {
          setHighPrice(Math.max(...prices))
          setLowPrice(Math.min(...prices))
        }
      }
    } catch (e) {
      console.error('fetchTrades error:', e)
    }
  }

  // ✅ Save trade to DB after onchain confirmation
  async function recordTrade(type: string, tradePrice: number, txHash: string) {
    await fetch(`/api/pairs/${pairId}/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: address, type, price: tradePrice, txHash, status: 'confirmed' }),
    })
  }

  // ✅ Update ownerAddress in DB after buy
  async function updateOwner(newOwner: string) {
    await fetch(`/api/pairs/${pairId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerAddress: newOwner, forSale: false }),
    }).catch(console.error)
  }

  const handleListForSale = async () => {
    if (!address) { alert('Connect wallet first'); return }
    const listPrice = parseFloat(price)
    if (isNaN(listPrice) || listPrice < 0.7) { alert('Minimum 0.7 USDC'); return }

    setIsTrading(true)

    if (isOnchain) {
      // ✅ Onchain listing
      setTxStatus('Opening wallet...')
      try {
        const provider = new BrowserProvider(window.ethereum as any)
        const signer = await provider.getSigner()
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        const priceInWei = parseUnits(listPrice.toString(), 6)

        const tx = await contract.listForSale(onchainTokenId!, priceInWei)
        setTxStatus('Waiting for confirmation...')
        const receipt = await tx.wait()

        await recordTrade('list', listPrice, receipt.hash)
        setIsForSale(true)
        setTxStatus('')
        alert(`✅ Listed onchain for ${listPrice} USDC!`)
        fetchTrades()
      } catch (e: any) {
        alert(e.code === 'ACTION_REJECTED' ? 'Transaction rejected' : e.message || 'Failed to list')
        setTxStatus('')
      }
    } else {
      // Fallback: DB-only listing for legacy off-chain NFTs
      setTxStatus('Listing...')
      try {
        await recordTrade('list', listPrice, `list-${address!.slice(2, 8)}-${Date.now()}`)
        setIsForSale(true)
        alert(`✅ Listed for ${listPrice} USDC (off-chain)`)
      } catch (e: any) {
        alert('Failed to list')
      } finally {
        setTxStatus('')
      }
    }

    setIsTrading(false)
  }

  const handleBuy = async () => {
    if (!address) { alert('Connect wallet first'); return }
    if (!isForSale) { alert('Not listed for sale yet'); return }
    if (isOwner) { alert('You already own this NFT'); return }

    const tradePrice = parseFloat(price)
    if (isNaN(tradePrice) || tradePrice < 0.7) { alert('Minimum 0.7 USDC'); return }

    setIsTrading(true)

    if (isOnchain) {
      // ✅ Real onchain buy with USDC approve
      setTxStatus('Approving USDC...')
      try {
        const provider = new BrowserProvider(window.ethereum as any)
        const signer = await provider.getSigner()
        const priceInWei = parseUnits(tradePrice.toString(), 6)

        // Approve USDC
        const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer)
        const allowance: bigint = await usdc.allowance(address, CONTRACT_ADDRESS)
        if (allowance < priceInWei) {
          const approveTx = await usdc.approve(CONTRACT_ADDRESS, priceInWei)
          setTxStatus('Approving...')
          await approveTx.wait()
        }

        // Buy
        setTxStatus('Buying...')
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        const buyTx = await contract.buyPairedUsername(onchainTokenId!)
        setTxStatus('Confirming...')
        const receipt = await buyTx.wait()

        await recordTrade('buy', tradePrice, receipt.hash)
        await updateOwner(address)

        setIsForSale(false)
        setCurrentOwner(address)
        setTxStatus('')
        alert(`✅ Bought ${pairedUsername} for ${tradePrice} USDC!`)
        fetchTrades()
        fetchPairStatus()
      } catch (e: any) {
        const msg = e.code === 'ACTION_REJECTED' ? 'Transaction rejected'
          : e.message?.includes('insufficient') ? 'Insufficient USDC balance'
          : e.message?.includes('Not for sale') ? 'NFT is not for sale'
          : e.message || 'Failed to buy'
        alert(msg)
        setTxStatus('')
      }
    } else {
      // Fallback: DB-only for off-chain records
      setTxStatus('Processing...')
      try {
        await recordTrade('buy', tradePrice, `buy-${address!.slice(2, 8)}-${Date.now()}`)
        await updateOwner(address)
        setIsForSale(false)
        setCurrentOwner(address)
        alert(`✅ Bought ${pairedUsername} (off-chain record)`)
        fetchTrades()
      } catch (e: any) {
        alert('Failed to buy')
      } finally {
        setTxStatus('')
      }
    }

    setIsTrading(false)
  }

  const handleSell = async () => {
    // Sell = re-list at new price
    await handleListForSale()
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
              {isOnchain && (
                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  Onchain #{onchainTokenId}
                </span>
              )}
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
        {[
          { label: 'Current Price', value: currentPrice.toFixed(2) },
          { label: '24h Change', value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}`, sub: `${priceChange >= 0 ? '+' : ''}${priceChangePercent}%`, color: priceChange >= 0 },
          { label: '24h High', value: highPrice.toFixed(2) },
          { label: '24h Low', value: lowPrice.toFixed(2) },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-lg font-bold ${item.color !== undefined ? (item.color ? 'text-green-500' : 'text-red-500') : 'text-foreground'}`}>
              {item.value}
            </p>
            {item.sub && <p className={`text-xs ${item.color ? 'text-green-500' : 'text-red-500'}`}>{item.sub}</p>}
            {!item.sub && <p className="text-xs text-muted-foreground">USDC</p>}
          </div>
        ))}
      </div>

      {/* List for Sale notice */}
      {isOwner && !isForSale && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            You own this NFT. List it for sale so others can buy it.
          </p>
          <button
            onClick={handleListForSale}
            disabled={isTrading}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 shrink-0"
          >
            <Tag className="h-3.5 w-3.5" />
            {isTrading ? txStatus || 'Listing...' : `List for Sale ${isOnchain ? '(Onchain)' : ''}`}
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
              className={`rounded-lg py-2.5 font-semibold transition-all ${orderType === 'buy' ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'}`}
            >
              <TrendingUp className="inline h-4 w-4 mr-1.5" />Buy
            </button>
            <button
              onClick={() => setOrderType('sell')}
              className={`rounded-lg py-2.5 font-semibold transition-all ${orderType === 'sell' ? 'bg-red-500 text-white' : 'bg-secondary text-muted-foreground'}`}
            >
              <TrendingDown className="inline h-4 w-4 mr-1.5" />Sell
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">Price (USDC)</label>
            <div className="relative">
              <input
                type="number" step="0.01" min="0.7" value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-16 text-base font-mono text-foreground outline-none focus:border-primary"
                placeholder="0.70"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">USDC</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Min: 0.7 • Market: {currentPrice.toFixed(2)} USDC</p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3 mb-4">
            <div className="flex justify-between text-sm">
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
            disabled={isTrading || parseFloat(price) < 0.7 || !address || (orderType === 'buy' && (!isForSale || isOwner))}
            className={`w-full rounded-lg py-3.5 font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${orderType === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {!address ? 'Connect Wallet'
              : isTrading ? (txStatus || 'Processing...')
              : isOwner && orderType === 'buy' ? 'You own this NFT'
              : `${orderType === 'buy' ? 'Buy' : 'Sell/List'} ${tradingPair}`}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            {isOnchain ? '⛽ Gas fee required from your wallet' : '⚠️ Off-chain record — mint new pair for onchain trading'}
          </p>
        </div>

        {/* Recent Trades */}
        <div className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />Recent Trades
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
                    {trade.type === 'buy' ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                    <div>
                      <p className={`text-sm font-bold ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{trade.type.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{trade.from.slice(0, 6)}...{trade.from.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{trade.price.toFixed(2)} USDC</p>
                    <p className="text-xs text-muted-foreground">{new Date(trade.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-lg border border-border bg-accent/40 p-3">
            <p className="text-xs font-medium text-foreground mb-2">📊 Trading Info</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Asset Type:</span><span className="font-medium text-foreground">Paired Username NFT</span></div>
              <div className="flex justify-between"><span>Token ID:</span><span className="font-medium text-foreground">{onchainTokenId ? `#${onchainTokenId}` : 'Off-chain'}</span></div>
              <div className="flex justify-between"><span>Starting Price:</span><span className="font-medium text-foreground">0.7 USDC</span></div>
              <div className="flex justify-between"><span>Network:</span><span className="font-medium text-foreground">Base Mainnet</span></div>
              <div className="flex justify-between"><span>Platform Fee:</span><span className="font-medium text-foreground">1% (to treasury)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}