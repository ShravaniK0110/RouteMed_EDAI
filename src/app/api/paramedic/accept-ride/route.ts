export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiError, apiCatchError } from '@/lib/api-error';
import { notifyPatientRideAccepted } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      request_id,
      paramedic_id,
    } = body;

    console.log('[ACCEPT RIDE] Incoming:', body);

    if (!request_id || !paramedic_id) {
      return apiError('BAD_REQUEST', 'Missing request_id or paramedic_id');
    }

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (rideError || !ride) {
      return apiError('NOT_FOUND', 'Ride not found');
    }

    if (
      ride.status === 'accepted' &&
      ride.paramedic_id === paramedic_id
    ) {
      return NextResponse.json({
        success: true,
        message: 'Ride already accepted by this paramedic',
        ride,
      });
    }

    if (ride.status !== 'searching') {
      return apiError('CONFLICT', `Ride already ${ride.status}`);
    }

    if (
      ride.paramedic_id &&
      ride.paramedic_id !== paramedic_id
    ) {
      return apiError('CONFLICT', 'Ride assigned to another paramedic');
    }

    const { data: paramedic, error: paramedicError } = await supabase
      .from('paramedics')
      .select('id, full_name, is_online')
      .eq('id', paramedic_id)
      .single();

    if (paramedicError || !paramedic) {
      return apiError('NOT_FOUND', 'Paramedic not found');
    }

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'accepted',
        paramedic_id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', request_id)
      .eq('status', 'searching')
      .select()
      .single();

    if (updateError || !updatedRide) {
      console.error('[ACCEPT RIDE] Update Error:', updateError);
      return apiError('CONFLICT', 'Ride already accepted or unavailable');
    }

    await supabase
      .from('paramedics')
      .update({
        is_online: false,
      })
      .eq('id', paramedic_id);

    await notifyPatientRideAccepted(
      ride.patient_id,
      paramedic.full_name || 'Your Paramedic',
      10
    );

    return NextResponse.json({
      success: true,
      message: 'Ride accepted successfully',
      ride: updatedRide,
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'ACCEPT_RIDE');
  }
}