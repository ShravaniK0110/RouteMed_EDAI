export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistanceKm } from '@/lib/matching';
import { getTotalFare } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const { request_id, paramedic_id } = await req.json();

    if (!request_id || !paramedic_id) {
      return NextResponse.json({ error: 'Missing request_id or paramedic_id' }, { status: 400 });
    }

    // 1. Fetch ride details
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // 2. Fetch paramedic's current GPS location
    const { data: paramedic, error: paramedicError } = await supabase
      .from('paramedics')
      .select('lat, lng')
      .eq('id', paramedic_id)
      .single();

    if (paramedicError || !paramedic) {
      return NextResponse.json({ error: 'Paramedic not found' }, { status: 404 });
    }

    // 3. Calculate real distance and fare
    // If paramedic GPS hasn't fired yet, fall back to a minimum 2km estimate
    const distanceKm = (paramedic.lat && paramedic.lng)
      ? getDistanceKm(
          paramedic.lat,
          paramedic.lng,
          ride.pickup_lat,
          ride.pickup_lng
        )
      : 2.0;

    // Estimate travel time: assume average city speed of 30km/h in Pune traffic
    const timeMins = Math.round((distanceKm / 30) * 60);

    // Use risk_score from ride if available (set by ML analysis), else default 0
    const riskScore = ride.risk_score ?? 0;

    const totalFare = getTotalFare(distanceKm, timeMins, riskScore);

    console.log(
      `[Accept Ride] Ride ${request_id} | Distance: ${distanceKm.toFixed(2)}km | ` +
      `Time: ${timeMins}min | Risk: ${riskScore} | Fare: ₹${totalFare.toFixed(2)}`
    );

    // 4. Update ride — status, paramedic, timestamp, and calculated fare
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'accepted',
        paramedic_id: paramedic_id,
        accepted_at: new Date().toISOString(),
        total_fare: Math.round(totalFare),   // rounded to nearest rupee
        distance_km: parseFloat(distanceKm.toFixed(2)),
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('Acceptance DB Error:', updateError.message);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // 5. Mark paramedic as busy (offline) so smart-match won't re-assign them
    await supabase
      .from('paramedics')
      .update({ is_online: false })
      .eq('id', paramedic_id);

    return NextResponse.json({
      success: true,
      fare: Math.round(totalFare),
      distance_km: parseFloat(distanceKm.toFixed(2)),
      estimated_mins: timeMins,
    });

  } catch (err: any) {
    console.error('Critical Accept API Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}