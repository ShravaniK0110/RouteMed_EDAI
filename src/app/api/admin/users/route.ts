export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    // 1. Fetch rides with Paramedic details
    // We use the 'rides' table and join with 'paramedics' to get the driver's name
    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        *,
        paramedics (
          full_name,
          vehicle_registration
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    // 2. Return the data
    return NextResponse.json({ 
      success: true, 
      rides: rides.map(ride => ({
        ...ride,
        // Flatten the paramedic data to match what your frontend likely expects
        paramedic_name: ride.paramedics?.full_name || 'Unassigned',
        vehicle: ride.paramedics?.vehicle_registration || 'N/A'
      }))
    });

  } catch (error: any) {
    console.error('Error fetching global rides:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rides', details: error.message }, 
      { status: 500 }
    )
  }
}