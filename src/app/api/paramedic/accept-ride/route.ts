export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistanceKm } from '@/lib/matching';
import { getTotalFare } from '@/lib/pricing';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, AcceptRideSchema } from '@/lib/validation';
import { notifyPatientRideAccepted } from '@/lib/notifications';
import { FALLBACK_DISTANCE_KM, FALLBACK_AMBULANCE_SPEED } from '@/lib/config';

export async function POST(req: Request) {
  const { data: body, error: validationError } = await validateBody(req, AcceptRideSchema);
  if (validationError) return validationError;

  try {
    const { request_id, paramedic_id } = body;

    console.log('[ACCEPT RIDE] Incoming Request:', { request_id, paramedic_id });

    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !ride) {
      console.error('[ACCEPT RIDE] Ride Fetch Error:', fetchError);
      return apiError('NOT_FOUND', 'Ride not found');
    }

    if (ride.status !== 'searching') {
      return apiError('CONFLICT', `Ride already ${ride.status}`);
    }

    const { data: paramedic, error: paramedicError } = await supabase
      .from('paramedics')
      .select('id, current_lat, current_lng, is_online, full_name')
      .eq('id', paramedic_id)
      .single();

    if (paramedicError || !paramedic) {
      console.error('[ACCEPT RIDE] Paramedic Error:', paramedicError);
      return apiError('NOT_FOUND', 'Paramedic not found');
    }

    if (!paramedic.is_online) {
      return apiError('CONFLICT', 'Paramedic is offline/unavailable');
    }

    const hasGPS = paramedic.current_lat !== null && paramedic.current_lng !== null;
    const distanceKm = hasGPS
      ? getDistanceKm(paramedic.current_lat, paramedic.current_lng, ride.pickup_lat, ride.pickup_lng)
      : FALLBACK_DISTANCE_KM;

    const timeMins   = Math.max(1, Math.round((distanceKm / FALLBACK_AMBULANCE_SPEED) * 60));
    const riskScore  = ride.risk_score ?? 0;
    const totalFare  = getTotalFare(distanceKm, timeMins, riskScore);

    console.log('[ACCEPT RIDE] Calculations:', { distanceKm, timeMins, riskScore, totalFare });

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({
        status:       'accepted',
        paramedic_id,
        accepted_at:  new Date().toISOString(),
        total_fare:   Math.round(totalFare),
        distance_km:  parseFloat(distanceKm.toFixed(2)),
      })
      .eq('id', request_id)
      .eq('status', 'searching')
      .select()
      .single();

    if (updateError || !updatedRide) {
      console.error('[ACCEPT RIDE] Update Error:', updateError);
      return apiError('CONFLICT', 'Ride already accepted or unavailable');
    }

    const { error: paramedicUpdateError } = await supabase
      .from('paramedics')
      .update({ is_online: false })
      .eq('id', paramedic_id);

    if (paramedicUpdateError) {
      console.error('[ACCEPT RIDE] Failed To Update Paramedic Status:', paramedicUpdateError);
    }

    await notifyPatientRideAccepted(
      ride.patient_id,
      paramedic.full_name ?? 'Your Paramedic',
      timeMins
    );

    return NextResponse.json({
      success:       true,
      message:       'Ride accepted successfully',
      ride:          updatedRide,
      fare:          Math.round(totalFare),
      distance_km:   parseFloat(distanceKm.toFixed(2)),
      estimated_mins: timeMins,
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'ACCEPT_RIDE');
  }
}
