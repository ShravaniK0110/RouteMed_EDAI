import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { patientId, pickupLat, pickupLng, hospitalId, severity } = await req.json();

    // 1. Create the Ride record
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert([{ 
        patient_id: patientId, 
        hospital_id: hospitalId, 
        pickup_lat: pickupLat, 
        pickup_lng: pickupLng,
        status: 'searching' 
      }])
      .select().single();

    if (rideError) throw rideError;

    // 2. FIXED: Hospital Pre-Alert (Runs before response)
    await supabase.from('hospital_alerts').insert([{
      ride_id: ride.id,
      hospital_id: hospitalId,
      severity: severity
    }]);

    return NextResponse.json({ success: true, rideId: ride.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}