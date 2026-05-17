export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistanceKm } from '@/lib/matching';
import { getTotalFare } from '@/lib/pricing';
import { verifyAuthHeader } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Auth check
    const user = verifyAuthHeader(req.headers.get('authorization'));
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { request_id, paramedic_id } = body;

    if (!request_id || !paramedic_id) {
      return NextResponse.json(
        { success: false, error: 'Missing request_id or paramedic_id' },
        { status: 400 }
      );
    }

    // Security: paramedic can only accept for themselves
    if (user.role === 'paramedic' && user.id !== paramedic_id) {
      return NextResponse.json(
        { success: false, error: 'You can only accept rides for yourself' },
        { status: 403 }
      );
    }

    // Fetch paramedic first (needed for fare calc)
    const { data: paramedic, error: paramedicError } = await supabase
      .from('paramedics')
      .select('id, current_lat, current_lng, is_online')
      .eq('id', paramedic_id)
      .single();

    if (paramedicError || !paramedic) {
      return NextResponse.json({ success: false, error: 'Paramedic not found' }, { status: 404 });
    }

    if (!paramedic.is_online) {
      return NextResponse.json(
        { success: false, error: 'Paramedic is offline — go online first' },
        { status: 409 }
      );
    }

    // Fetch ride to get pickup coords for fare calc
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('id, status, pickup_lat, pickup_lng, risk_score, paramedic_id')
      .eq('id', request_id)
      .single();

    if (fetchError || !ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
    }

    // Pre-check: give a clear message if already taken by someone else
    if (ride.status !== 'searching') {
      return NextResponse.json(
        { success: false, error: `Ride is already ${ride.status}` },
        { status: 409 }
      );
    }

    // If this paramedic is already assigned (duplicate button click)
    if (ride.paramedic_id === paramedic_id && ride.status === 'accepted') {
      return NextResponse.json(
        { success: false, error: 'You already accepted this ride' },
        { status: 409 }
      );
    }

    // Calculate fare BEFORE the atomic update
    const hasGPS = paramedic.current_lat !== null && paramedic.current_lng !== null;
    const distanceKm = hasGPS
      ? getDistanceKm(paramedic.current_lat, paramedic.current_lng, ride.pickup_lat, ride.pickup_lng)
      : 2.0;
    const timeMins = Math.max(1, Math.round((distanceKm / 30) * 60));
    const riskScore = ride.risk_score ?? 0;
    const totalFare = getTotalFare(distanceKm, timeMins, riskScore);

    // ATOMIC UPDATE — this is the real race-condition guard.
    // If another paramedic already accepted, status won't be 'searching' anymore
    // and this update will return 0 rows, caught by !updatedRide below.
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
      .eq('status', 'searching') // Atomic guard — only succeeds if still 'searching'
      .select()
      .single();

    if (updateError || !updatedRide) {
      console.error('[ACCEPT RIDE] Atomic update failed — ride was taken:', updateError);
      return NextResponse.json(
        { success: false, error: 'Ride was just accepted by another paramedic' },
        { status: 409 }
      );
    }

    // Mark paramedic as busy (not online/available)
    const { error: paramedicUpdateError } = await supabase
      .from('paramedics')
      .update({ is_online: false })
      .eq('id', paramedic_id);

    if (paramedicUpdateError) {
      // Non-fatal — ride is accepted, just log it
      console.error('[ACCEPT RIDE] Failed to mark paramedic busy:', paramedicUpdateError);
    }

    console.log(`[ACCEPT RIDE] ✅ Paramedic ${paramedic_id} accepted ride ${request_id}`);

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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}