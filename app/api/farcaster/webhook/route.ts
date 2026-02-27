import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Handle different Farcaster events
    switch (data.type) {
      case 'frame_button_clicked':
        // Handle Frame button click
        return handleFrameButton(data)
      
      case 'cast_created':
        // Handle when someone casts about your app
        return handleCastCreated(data)
      
      default:
        return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Farcaster webhook error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

async function handleFrameButton(data: any) {
  const { button_index, fid, cast_hash } = data
  
  // Handle different buttons
  if (button_index === 2) {
    // "Send Value" button clicked
    // Return transaction frame
    return NextResponse.json({
      type: 'form',
      fields: [
        {
          type: 'number',
          name: 'amount',
          label: 'Amount (USDC)',
          placeholder: '0.7',
          min: 0.7,
        },
      ],
      button: {
        label: 'Send',
        action: 'tx',
        target: '/api/farcaster/send-value',
      },
    })
  }
  
  return NextResponse.json({ success: true })
}

async function handleCastCreated(data: any) {
  // Track when someone shares your app
  console.log('New cast about Names:', data)
  return NextResponse.json({ success: true })
}