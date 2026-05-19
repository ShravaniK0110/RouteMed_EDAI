export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

import { getDistanceKm } from '@/lib/matching';

import { getTotalFare } from '@/lib/pricing';

import {
  apiError,
  apiCatchError
} from '@/lib/api-error';

import {
  validateBody,
  AcceptRideSchema
} from '@/lib/validation';

import {
  notifyPatientRideAccepted
} from '@/lib/notifications';

import {
  FALLBACK_DISTANCE_KM,
  FALLBACK_AMBULANCE_SPEED_KMPH
} from '@/lib/config';

export async function POST(req: Request) {

  const {
    data: body,
    error: validationError
  }: {
    data: any;
    error: any;
  } = await validateBody(
    req,
    AcceptRideSchema
  );

  if (validationError) {
    return validationError;
  }

  try {

    const {
      request_id,
      paramedic_id
    } = body;

    console.log(
      '[ACCEPT RIDE] Incoming Request:',
      {
        request_id,
        paramedic_id
      }
    );

    // ---------------------------------------------------
    // Fetch Ride
    // ---------------------------------------------------

    const {
      data: ride,
      error: rideError
    } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (rideError || !ride) {

      console.error(
        '[ACCEPT RIDE] Ride Fetch Error:',
        rideError
      );

      return apiError(
        'NOT_FOUND',
        'Ride not found'
      );
    }

    // ---------------------------------------------------
    // Fetch Paramedic
    // ---------------------------------------------------

    const {
      data: paramedic,
      error: paramedicError
    } = await supabase
      .from('paramedics')
      .select(`
        id,
        current_lat,
        current_lng,
        is_online,
        full_name
      `)
      .eq('id', paramedic_id)
      .single();

    if (paramedicError || !paramedic) {

      console.error(
        '[ACCEPT RIDE] Paramedic Error:',
        paramedicError
      );

      return apiError(
        'NOT_FOUND',
        'Paramedic not found'
      );
    }

    if (!paramedic.is_online) {

      return apiError(
        'CONFLICT',
        'Paramedic is offline/unavailable'
      );
    }

    // ---------------------------------------------------
    // Distance + ETA + Fare
    // ---------------------------------------------------

    const hasGPS =
      paramedic.current_lat !== null &&
      paramedic.current_lng !== null;

    const distanceKm = hasGPS
      ? getDistanceKm(
          paramedic.current_lat,
          paramedic.current_lng,
          ride.pickup_lat,
          ride.pickup_lng
        )
      : FALLBACK_DISTANCE_KM;

    const timeMins = Math.max(
      1,
      Math.round(
        (
          distanceKm /
          FALLBACK_AMBULANCE_SPEED_KMPH
        ) * 60
      )
    );

    const riskScore =
      ride.risk_score ?? 0;

    const totalFare =
      getTotalFare(
        distanceKm,
        timeMins,
        riskScore
      );

    // ---------------------------------------------------
    // ATOMIC ACCEPTANCE
    // ---------------------------------------------------

    const {
      data: rpcData,
      error: rpcError
    } = await supabase.rpc(
      'accept_ride_atomic',
      {
        p_request_id: request_id,
        p_paramedic_id: paramedic_id
      }
    );

    if (rpcError) {

      console.error(
        '[ACCEPT RIDE RPC ERROR]',
        rpcError
      );

      return apiError(
        'CONFLICT',
        'Ride already accepted'
      );
    }

    const rpcResult =
      rpcData?.[0];

    if (!rpcResult?.success) {

      return apiError(
        'CONFLICT',
        rpcResult?.message ||
          'Ride unavailable'
      );
    }

    // ---------------------------------------------------
    // Final Ride Update
    // ---------------------------------------------------

    const {
      data: updatedRide,
      error: updateError
    } = await supabase
      .from('rides')
      .update({
        total_fare:
          Math.round(totalFare),

        distance_km:
          parseFloat(
            distanceKm.toFixed(2)
          ),
      })
      .eq('id', request_id)
      .select()
      .single();

    if (updateError || !updatedRide) {

      console.error(
        '[ACCEPT RIDE] Final Update Error:',
        updateError
      );

      return apiError('INTERNAL_ERROR', 'Something went wrong');
    }

    // ---------------------------------------------------
    // Set Paramedic Offline
    // ---------------------------------------------------

    const {
      error: paramedicUpdateError
    } = await supabase
      .from('paramedics')
      .update({
        is_online: false
      })
      .eq('id', paramedic_id);

    if (paramedicUpdateError) {

      console.error(
        '[ACCEPT RIDE] Failed To Update Paramedic Status:',
        paramedicUpdateError
      );
    }

    // ---------------------------------------------------
    // Notify Patient
    // ---------------------------------------------------

    await notifyPatientRideAccepted(
      ride.patient_id,
      paramedic.full_name ||
        'Your Paramedic',
      timeMins
    );

    // ---------------------------------------------------
    // Success
    // ---------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        'Ride accepted successfully',

      ride: updatedRide,

      fare:
        Math.round(totalFare),

      distance_km:
        parseFloat(
          distanceKm.toFixed(2)
        ),

      estimated_mins:
        timeMins,
    });

  } catch (err: unknown) {

    return apiCatchError(
      err,
      'ACCEPT_RIDE'
    );
  }
}