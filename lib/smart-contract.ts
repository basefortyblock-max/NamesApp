import { ethers } from 'ethers'

// Contract address from environment - can be swapped in Vercel env settings
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USERNAME_NFT_CONTRACT
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

if (!CONTRACT_ADDRESS) {
  console.warn('[WARNING] NEXT_PUBLIC_USERNAME_NFT_CONTRACT not set. Using dummy address.')
}

// Contract ABI (minimal interface)
const CONTRACT_ABI = [
  'function mintPairedUsername(string username1, string platform1, string username2, string platform2) returns (uint256)',
  'function listForSale(uint256 tokenId, uint256 price)',
  'function buyPairedUsername(uint256 tokenId)',
  'function getPairedUsername(uint256 tokenId) view returns (tuple(string username1, string platform1, string username2, string platform2, string pairedName, address creator, uint256 currentPrice, uint256 totalVolume, bool forSale, uint256 timestamp))',
]

export async function mintPairedUsername(
  signer: ethers.Signer,
  username1: string,
  platform1: string,
  username2: string,
  platform2: string
) {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  const tx = await contract.mintPairedUsername(username1, platform1, username2, platform2)
  const receipt = await tx.wait()
  
  // Get token ID from event
  const event = receipt.events?.find((e: any) => e.event === 'UsernamePaired')
  const tokenId = event?.args?.tokenId
  
  return { tokenId: tokenId.toString(), txHash: receipt.transactionHash }
}

export async function listUsernameForSale(
  signer: ethers.Signer,
  tokenId: string,
  priceInUSDC: number
) {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  
  // Convert USDC to wei (6 decimals)
  const priceWei = Math.floor(priceInUSDC * 1e6)
  
  const tx = await contract.listForSale(tokenId, priceWei)
  await tx.wait()
}

export async function buyPairedUsername(
  signer: ethers.Signer,
  tokenId: string
) {
  // First approve USDC spending
  const usdcContract = new ethers.Contract(
    USDC_ADDRESS,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  )
  
  // Get price from contract
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  const pairedData = await contract.getPairedUsername(tokenId)
  const price = pairedData.currentPrice
  
  // Approve USDC
  const approveTx = await usdcContract.approve(CONTRACT_ADDRESS, price)
  await approveTx.wait()
  
  // Buy username
  const tx = await contract.buyPairedUsername(tokenId)
  await tx.wait()
}
