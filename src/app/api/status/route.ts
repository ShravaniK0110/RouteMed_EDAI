import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'online',
    platform: 'AmbulanceRoute Pune (Uber-like Model)',
    version: '2.0.0'
  })
}
