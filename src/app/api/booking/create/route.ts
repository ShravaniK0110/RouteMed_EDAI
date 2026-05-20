import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiError, apiCatchError } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      patientId,
      pickupLat,
      pickupLng,
      hospitalId,
      severity,
    } = body;

    if (
      !patientId ||
      pickupLat === undefined ||
      pickupLng === undefined ||
      !hospitalId
    ) {
      return apiError('BAD_REQUEST', 'Missing required booking fields');
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return apiError('NOT_FOUND', 'Patient not found');
    }

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert([
        {
          patient_id: patientId,
          hospital_id: hospitalId,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          severity: severity || 'Medium',
          status: 'searching',
        },
      ])
      .select()
      .single();

    if (rideError) {
      console.error('[BOOKING CREATE] Ride Insert Error:', rideError);
      throw rideError;
    }

    await supabase
      .from('hospital_alerts')
      .insert([
        {
          ride_id: ride.id,
          hospital_id: hospitalId,
          severity: severity || 'Medium',
        },
      ]);

    return NextResponse.json({
      success: true,
      rideId: ride.id,
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'BOOKING_CREATE');
  }
}