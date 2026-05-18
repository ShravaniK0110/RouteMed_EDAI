export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistanceKm } from '@/lib/matching';
import { verifyAuthHeader } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, SmartMatchSchema } from '@/lib/validation';
import { notifyParamedicNewRide } from '@/lib/notifications';
import { UNREACHABLE_DISTANCE_KM } from '@/lib/config';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const user       = verifyAuthHeader(authHeader);
  if (!user) return apiError('UNAUTHORIZED', 'Unauthorized');

  const { data: body, error: validationError } = await validateBody(req, SmartMatchSchema);
  if (validationError) return validationError;

  try {
    const { request_id } = body;

    console.log('[SMART MATCH] Incoming Request:', body);

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (rideError || !ride) {
      console.error('[SMART MATCH] Ride Fetch Error:', rideError);
      return apiError('NOT_FOUND', 'Ride not found');
    }

    if (ride.status !== 'searching') return apiError('CONFLICT', `Ride already ${ride.status}`);
    if (ride.paramedic_id)           return apiError('CONFLICT', 'Ride already assigned');

    const { data: paramedics, error: paramedicError } = await supabase
      .from('paramedics')
      .select('*')
      .eq('is_online', true);

    if (paramedicError) {
      console.error('[SMART MATCH] Paramedic Fetch Error:', paramedicError);
      throw paramedicError;
    }

    if (!paramedics || paramedics.length === 0) {
      return apiError('NOT_FOUND', 'No paramedics online');
    }

    const scored = paramedics
      .map((p) => ({
        ...p,
        dist:
          p.current_lat !== null && p.current_lng !== null
            ? getDistanceKm(ride.pickup_lat, ride.pickup_lng, p.current_lat, p.current_lng)
            : UNREACHABLE_DISTANCE_KM, // named sentinel — not a magic number
      }))
      .sort((a, b) => a.dist - b.dist);

    const bestMatch = scored[0];
    if (!bestMatch) return apiError('NOT_FOUND', 'No valid paramedic found');

    console.log('[SMART MATCH] Best Match:', { id: bestMatch.id, name: bestMatch.full_name, distance: bestMatch.dist });

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({ paramedic_id: bestMatch.id })
      .eq('id', request_id)
      .eq('status', 'searching')
      .select()
      .single();

    if (updateError || !updatedRide) {
      console.error('[SMART MATCH] Assignment Error:', updateError);
      return apiError('CONFLICT', 'Ride assignment failed');
    }

    console.log(`[SMART MATCH] Assigned ${bestMatch.full_name} to Ride ${request_id}`);

    await notifyParamedicNewRide(bestMatch.id, request_id, ride.emergency_type);

    return NextResponse.json({
      success:     true,
      assigned_to: bestMatch.full_name,
      assigned_id: bestMatch.id,
      distance_km: bestMatch.dist,
      ride:        updatedRide,
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'SMART_MATCH');
  }
}
