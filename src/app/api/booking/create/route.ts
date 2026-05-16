import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuthHeader } from '@/lib/auth';

export async function POST(req: Request) {

  try {

    const authHeader =
      req.headers.get('authorization');

    const user =
      verifyAuthHeader(authHeader);

    if (!user) {

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      patientId,
      pickupLat,
      pickupLng,
      hospitalId,
      severity,
    } = body;

    console.log(
      '[BOOKING CREATE] Incoming Request:',
      body
    );

    if (
      !patientId ||
      pickupLat === undefined ||
      pickupLng === undefined ||
      !hospitalId
    ) {

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    const { data: ride, error: rideError } =
      await supabase
        .from('rides')
        .insert([
          {
            patient_id: patientId,
            hospital_id: hospitalId,
            pickup_lat: pickupLat,
            pickup_lng: pickupLng,
            status: 'searching',
          },
        ])
        .select()
        .single();

    if (rideError) {

      console.error(
        '[BOOKING CREATE] Ride Insert Error:',
        rideError
      );

      throw rideError;
    }

    console.log(
      '[BOOKING CREATE] Ride Created:',
      ride
    );

    const { error: alertError } =
      await supabase
        .from('hospital_alerts')
        .insert([
          {
            ride_id: ride.id,
            hospital_id: hospitalId,
            severity: severity || 'medium',
          },
        ]);

    if (alertError) {

      console.error(
        '[BOOKING CREATE] Hospital Alert Error:',
        alertError
      );
    }

    return NextResponse.json({
      success: true,
      rideId: ride.id,
    });

  } catch (error: any) {

    console.error(
      '[BOOKING CREATE] CRITICAL ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}