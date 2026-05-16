export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDistanceKm } from '@/lib/matching';

export async function POST(req: Request) {
  try {
    const { request_id } = await req.json();

    // 1. Get Ride Details
    const { data: ride } = await supabase.from('rides').select('*').eq('id', request_id).single();
    if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });

    // 2. Fetch ALL online paramedics
    // We removed the null check on lat/lng so we don't ignore new online users
    const { data: paramedics } = await supabase
      .from('paramedics')
      .select('*')
      .eq('is_online', true);
    
    if (!paramedics || paramedics.length === 0) {
      return NextResponse.json({ error: 'No paramedics online' }, { status: 404 });
    }

    // 3. Score & Sort with 999 Fallback (Fix 1)
    const scored = paramedics.map(p => ({
      ...p,
      // If lat/lng are NULL, we use 999km as a fallback to ensure they are still "matchable"
      dist: (p.current_lat && p.current_lng)
        ? getDistanceKm(ride.pickup_lat, ride.pickup_lng, p.current_lat, p.current_lng)
        : 999
    })).sort((a, b) => a.dist - b.dist);

    const bestMatch = scored[0];

    // 4. Assign the best match to the ride
    const { error: updateError } = await supabase
      .from('rides')
      .update({ paramedic_id: bestMatch.id })
      .eq('id', request_id);

    if (updateError) throw updateError;

    console.log(`[Smart Match] Assigned ${bestMatch.full_name} to Ride ${request_id}`);

    return NextResponse.json({ 
      success: true, 
      assigned_to: bestMatch.full_name,
      assigned_id: bestMatch.id 
    });

  } catch (error: any) {
    console.error('Smart Match Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}