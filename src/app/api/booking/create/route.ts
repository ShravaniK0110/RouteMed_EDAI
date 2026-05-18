import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuthHeader } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, BookingCreateSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const user       = verifyAuthHeader(authHeader);
  if (!user) return apiError('UNAUTHORIZED', 'Unauthorized');

  const { data: body, error: validationError } = await validateBody(req, BookingCreateSchema);
  if (validationError) return validationError;

  try {
    const { patientId, pickupLat, pickupLng, hospitalId, severity } = body;

    console.log('[BOOKING CREATE] Incoming Request:', body);

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert([{
        patient_id:  patientId,
        hospital_id: hospitalId,
        pickup_lat:  pickupLat,
        pickup_lng:  pickupLng,
        status:      'searching',
      }])
      .select()
      .single();

    if (rideError) {
      console.error('[BOOKING CREATE] Ride Insert Error:', rideError);
      throw rideError;
    }

    console.log('[BOOKING CREATE] Ride Created:', ride);

    const { error: alertError } = await supabase
      .from('hospital_alerts')
      .insert([{
        ride_id:     ride.id,
        hospital_id: hospitalId,
        severity:    severity || 'medium',
      }]);

    if (alertError) {
      console.error('[BOOKING CREATE] Hospital Alert Error:', alertError);
    }

    return NextResponse.json({ success: true, rideId: ride.id });

  } catch (err: unknown) {
    return apiCatchError(err, 'BOOKING_CREATE');
  }
}
