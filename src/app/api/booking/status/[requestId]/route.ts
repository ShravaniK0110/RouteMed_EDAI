export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiError, apiCatchError } from '@/lib/api-error';

export async function GET(req: Request, { params }: { params: { requestId: string } }) {
  try {
    const { requestId } = params;

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
      return apiError('NOT_FOUND', 'Request not found');
    }

    return NextResponse.json({
      success: true,
      status: ride.status,
      paramedic_id: ride.paramedic_id,
      paramedic_details: ride.paramedics ? {
        name: ride.paramedics.full_name,
        phone: ride.paramedics.phone_number || 'N/A',
        vehicle: ride.paramedics.vehicle_registration,
        rating: ride.paramedics.rating ?? 5.0,
      } : null,
      current_location: ride.paramedics ? {
        lat: ride.paramedics.current_lat,
        lng: ride.paramedics.current_lng,
      } : null,
      eta: ride.estimated_arrival_minutes || null,
      hospital_destination: ride.destination_address || 'Pending selection',
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'BOOKING_STATUS');
  }
}
