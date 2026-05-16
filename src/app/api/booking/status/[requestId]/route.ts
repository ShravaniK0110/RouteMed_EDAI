export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: { requestId: string } }) {
  try {
    const { requestId } = params;

    // 1. Fetch the ride and join with the paramedics table
    // This replaces the Prisma 'include: { paramedic: true }' logic
    const { data: ride, error } = await supabase
      .from('rides')
      .select(`
        *,
        paramedics (
          full_name,
          phone_number,
          vehicle_registration,
          rating,
          current_lat,
          current_lng
        )
      `)
      .eq('id', requestId)
      .single();

    if (error || !ride) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // 2. Format and return the response exactly how your frontend expects it
    return NextResponse.json({
      success: true,
      status: ride.status,
      paramedic_id: ride.paramedic_id,
      paramedic_details: ride.paramedics ? {
        name: ride.paramedics.full_name,
        phone: ride.paramedics.phone_number || 'N/A',
        vehicle: ride.paramedics.vehicle_registration,
        rating: ride.paramedics.rating ?? 5.0
      } : null,
      current_location: ride.paramedics ? {
        lat: ride.paramedics.current_lat,
        lng: ride.paramedics.current_lng
      } : null,
      eta: ride.estimated_arrival_minutes || null,
      hospital_destination: ride.destination_address || 'Pending selection'
    });

  } catch (error: any) {
    console.error('Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: error.message }, 
      { status: 500 }
    );
  }
}