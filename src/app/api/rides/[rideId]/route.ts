import { NextRequest, NextResponse } from 'next/server'

// This endpoint returns active rides for paramedics
export async function GET(req: NextRequest) {
  try {
    // In production, fetch from database
    // For now, we'll read from a global store
    const rideStore = (global as any).activeRides || []
    
    const activeRides = rideStore.filter((ride: any) => 
      ride.status === 'searching' || ride.status === 'assigned'
    )

    return NextResponse.json({ rides: activeRides })
  } catch (error) {
    console.error('Error fetching rides:', error)
    return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
  }
}