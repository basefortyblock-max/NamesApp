// lib/paymaster.ts
import { http, createPublicClient, createWalletClient, type Address, type Hash } from 'viem'
import { base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

/**
 * Paymaster Configuration for Coinbase CDP
 * This enables gasless transactions for value/appreciation posts
 */

interface PaymasterConfig {
  paymasterUrl: string
  chainId: number
}

const config: PaymasterConfig = {
  paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL || '',
  chainId: base.id,
}

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
})

/**
 * Check if paymaster is configured
 */
export function isPaymasterConfigured(): boolean {
  return !!config.paymasterUrl && config.paymasterUrl.length > 0
}

/**
 * Sponsor a transaction using Coinbase Paymaster
 * Used for value/appreciation transactions (0.7+ USDC)
 */
export async function sponsorTransaction(params: {
  from: Address
  to: Address
  data: `0x${string}`
  value?: bigint
}): Promise<{ txHash: Hash; sponsored: boolean }> {
  try {
    if (!isPaymasterConfigured()) {
      throw new Error('Paymaster not configured')
    }

    // Call paymaster endpoint to get sponsored transaction
    const response = await fetch('/api/paymaster/sponsor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        data: params.data,
        value: params.value?.toString(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to sponsor transaction')
    }

    const result = await response.json()
    
    return {
      txHash: result.txHash,
      sponsored: true,
    }
  } catch (error) {
    console.error('Paymaster sponsorship failed:', error)
    throw error
  }
}

/**
 * Build USDC transfer data
 * USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address

export function buildUSDCTransferData(to: Address, amount: bigint): `0x${string}` {
  // ERC20 transfer function signature: transfer(address,uint256)
  const selector = '0xa9059cbb' // transfer function selector
  
  // Encode recipient address (pad to 32 bytes)
  const recipientPadded = to.slice(2).padStart(64, '0')
  
  // Encode amount (pad to 32 bytes)
  const amountHex = amount.toString(16).padStart(64, '0')
  
  return `${selector}${recipientPadded}${amountHex}` as `0x${string}`
}

/**
 * Send USDC with gasless transaction
 * Amount in USDC (6 decimals)
 */
export async function sendUSDCGasless(params: {
  from: Address
  to: Address
  amount: number // in USDC (e.g., 0.7 for 0.7 USDC)
}): Promise<{ txHash: Hash; sponsored: boolean }> {
  // Convert USDC amount to wei (6 decimals)
  const amountInWei = BigInt(Math.floor(params.amount * 1e6))
  
  // Build transfer data
  const data = buildUSDCTransferData(params.to, amountInWei)
  
  // Sponsor the transaction
  return await sponsorTransaction({
    from: params.from,
    to: USDC_ADDRESS,
    data,
  })
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(params: {
  from: Address
  to: Address
  data: `0x${string}`
  value?: bigint
}): Promise<bigint> {
  const gas = await publicClient.estimateGas({
    account: params.from,
    to: params.to,
    data: params.data,
    value: params.value,
  })
  
  return gas
}

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: Address): Promise<number> {
  try {
    // balanceOf(address) selector
    const data = `0x70a08231${address.slice(2).padStart(64, '0')}` as `0x${string}`
    
    const result = await publicClient.call({
      to: USDC_ADDRESS,
      data,
    })
    
    if (!result.data) return 0
    
    // Convert from 6 decimals to USDC
    const balance = BigInt(result.data)
    return Number(balance) / 1e6
  } catch (error) {
    console.error('Failed to get USDC balance:', error)
    return 0
  }
}

/**
 * Convert USDC to wei (6 decimals)
 */
export function usdcToWei(usdc: number): bigint {
  return BigInt(Math.floor(usdc * 1e6))
}

/**
 * Convert wei to USDC (6 decimals)
 */
export function weiToUsdc(wei: bigint): number {
  return Number(wei) / 1e6
}