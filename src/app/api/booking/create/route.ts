import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

import {
  apiError,
  apiCatchError
} from '@/lib/api-error';

import {
  validateBody,
  BookingCreateSchema
} from '@/lib/validation';

import {
  requireRole
} from '@/middleware/auth';

export async function POST(
  req: Request
) {

  // STRICT ROLE ENFORCEMENT
  const auth = requireRole(
    req,
    'patient'
  );

  if (auth instanceof NextResponse) {
    return auth;
  }

  const {
    data: body,
    error: validationError
  } = await validateBody(
    req,
    BookingCreateSchema
  );

  if (validationError) {
    return validationError;
  }

  try {

const bookingData = body as {
  pickupLat: number;
  pickupLng: number;
  hospitalId: string;
  severity?: string;
};

const {
  pickupLat,
  pickupLng,
  hospitalId,
  severity
} = bookingData;

    const patientId = auth.id;

    console.log(
      '[BOOKING CREATE] Incoming Request:',
      {
        patientId,
        pickupLat,
        pickupLng,
        hospitalId,
        severity
      }
    );

    // FIX:
    // severity now stored in rides table

    const {
      data: ride,
      error: rideError
    } = await supabase
      .from('rides')
      .insert([{
        patient_id: patientId,

        hospital_id: hospitalId,

        pickup_lat: pickupLat,

        pickup_lng: pickupLng,

        severity:
          severity || 'medium',

        status: 'searching',
      }])
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

    // Hospital alert
    const {
      error: alertError
    } = await supabase
      .from('hospital_alerts')
      .insert([{
        ride_id: ride.id,

        hospital_id: hospitalId,

        severity:
          severity || 'medium',
      }]);

    if (alertError) {

      console.error(
        '[BOOKING CREATE] Hospital Alert Error:',
        alertError
      );
    }

    return NextResponse.json({
      success: true,
      rideId: ride.id
    });

  } catch (err: unknown) {

    return apiCatchError(
      err,
      'BOOKING_CREATE'
    );
  }
}