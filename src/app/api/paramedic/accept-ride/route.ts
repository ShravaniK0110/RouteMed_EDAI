export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistanceKm } from '@/lib/matching';
import { getTotalFare } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { request_id, paramedic_id } = body;

    console.log('[ACCEPT RIDE] Incoming Request:', {
      request_id,
      paramedic_id,
    });

    if (!request_id || !paramedic_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing request_id or paramedic_id',
        },
        { status: 400 }
      );
    }

    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    console.log('[ACCEPT RIDE] Current Ride:', ride);

    if (fetchError || !ride) {
      console.error('[ACCEPT RIDE] Ride Fetch Error:', fetchError);

      return NextResponse.json(
        {
          success: false,
          error: 'Ride not found',
        },
        { status: 404 }
      );
    }

    if (ride.status !== 'searching') {
      console.warn('[ACCEPT RIDE] Ride Already Taken:', ride.status);

      return NextResponse.json(
        {
          success: false,
          error: `Ride already ${ride.status}`,
        },
        { status: 409 }
      );
    }

    const { data: paramedic, error: paramedicError } = await supabase
      .from('paramedics')
      .select('id, current_lat, current_lng, is_online')
      .eq('id', paramedic_id)
      .single();

    console.log('[ACCEPT RIDE] Paramedic:', paramedic);

    if (paramedicError || !paramedic) {
      console.error('[ACCEPT RIDE] Paramedic Error:', paramedicError);

      return NextResponse.json(
        {
          success: false,
          error: 'Paramedic not found',
        },
        { status: 404 }
      );
    }

   
    if (!paramedic.is_online) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramedic is offline/unavailable',
        },
        { status: 409 }
      );
    }

   
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
      : 2.0;

    const timeMins = Math.max(
      1,
      Math.round((distanceKm / 30) * 60)
    );

    const riskScore = ride.risk_score ?? 0;

    const totalFare = getTotalFare(
      distanceKm,
      timeMins,
      riskScore
    );

    console.log('[ACCEPT RIDE] Calculations:', {
      distanceKm,
      timeMins,
      riskScore,
      totalFare,
    });

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'accepted',
        paramedic_id: paramedic_id,
        accepted_at: new Date().toISOString(),
        total_fare: Math.round(totalFare),
        distance_km: parseFloat(distanceKm.toFixed(2)),
      })
      .eq('id', request_id)
      .eq('status', 'searching')
      .select()
      .single();

    console.log('[ACCEPT RIDE] Update Result:', updatedRide);

    if (updateError || !updatedRide) {
      console.error('[ACCEPT RIDE] Update Error:', updateError);

      return NextResponse.json(
        {
          success: false,
          error: 'Ride already accepted or unavailable',
        },
        { status: 409 }
      );
    }

    const { error: paramedicUpdateError } = await supabase
      .from('paramedics')
      .update({
        is_online: false,
      })
      .eq('id', paramedic_id);

    if (paramedicUpdateError) {
      console.error(
        '[ACCEPT RIDE] Failed To Update Paramedic Status:',
        paramedicUpdateError
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ride accepted successfully',
      ride: updatedRide,
      fare: Math.round(totalFare),
      distance_km: parseFloat(distanceKm.toFixed(2)),
      estimated_mins: timeMins,
    });

  } catch (err: any) {
    console.error('[ACCEPT RIDE] CRITICAL ERROR:', err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}