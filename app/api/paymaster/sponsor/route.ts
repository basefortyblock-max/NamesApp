// app/api/paymaster/sponsor/route.ts - SIMPLIFIED VERSION
import { NextRequest, NextResponse } from 'next/server'

/**
 * Simplified Gasless Paymaster Backend
 * Uses Coinbase CDP Paymaster for USDC transfers
 * 
 * IMPORTANT: Coinbase handles most of the complexity on the frontend
 * This backend is just for validation and logging
 */

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const MIN_VALUE = 0.7 // Minimum 0.7 USDC for story appreciation

export async function POST(request: NextRequest) {
  try {
    const { from, to, amount, storyId } = await request.json()
    
    // Validate inputs
    if (!from || !to || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate minimum amount
    if (amount < MIN_VALUE) {
      return NextResponse.json(
        { error: `Minimum amount is ${MIN_VALUE} USDC` },
        { status: 400 }
      )
    }
    
    // Log transaction for monitoring
    console.log('Sponsoring transaction:', {
      from,
      to,
      amount,
      storyId,
      timestamp: new Date().toISOString(),
    })
    
    // Here you can add additional validation:
    // - Check if story exists
    // - Check if user has enough balance
    // - Rate limiting
    // - Anti-spam measures
    
    // Return success - Coinbase SDK handles the actual sponsorship on frontend
    return NextResponse.json({
      success: true,
      sponsored: true,
      message: 'Transaction validated and ready for sponsorship',
      // Frontend will use OnchainKit to execute the sponsored transaction
    })
    
  } catch (error: any) {
    console.error('Paymaster validation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to validate transaction',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check paymaster status
 */
export async function GET(request: NextRequest) {
  try {
    const paymasterUrl = process.env.PAYMASTER_URL
    
    return NextResponse.json({
      configured: !!paymasterUrl,
      minValue: MIN_VALUE,
      usdcAddress: USDC_ADDRESS,
      network: 'base',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get paymaster status' },
      { status: 500 }
    )
  }
}