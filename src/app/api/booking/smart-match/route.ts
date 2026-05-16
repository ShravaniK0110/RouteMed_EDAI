export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

import { getDistanceKm } from '@/lib/matching';

import { verifyAuthHeader } from '@/lib/auth';

export async function POST(req: Request) {

  try {

    const authHeader =
      req.headers.get('authorization');

    const user =
      verifyAuthHeader(authHeader);

    if (!user) {

      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { request_id } = body;

    console.log(
      '[SMART MATCH] Incoming Request:',
      body
    );

    if (!request_id) {

      return NextResponse.json(
        {
          success: false,
          error: 'Missing request_id',
        },
        { status: 400 }
      );
    }

    const {
      data: ride,
      error: rideError,
    } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (rideError || !ride) {

      console.error(
        '[SMART MATCH] Ride Fetch Error:',
        rideError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Ride not found',
        },
        { status: 404 }
      );
    }

    if (ride.status !== 'searching') {

      return NextResponse.json(
        {
          success: false,
          error: `Ride already ${ride.status}`,
        },
        { status: 409 }
      );
    }

    if (ride.paramedic_id) {

      return NextResponse.json(
        {
          success: false,
          error: 'Ride already assigned',
        },
        { status: 409 }
      );
    }

    const {
      data: paramedics,
      error: paramedicError,
    } = await supabase
      .from('paramedics')
      .select('*')
      .eq('is_online', true);

    if (paramedicError) {

      console.error(
        '[SMART MATCH] Paramedic Fetch Error:',
        paramedicError
      );

      throw paramedicError;
    }

    if (
      !paramedics ||
      paramedics.length === 0
    ) {

      return NextResponse.json(
        {
          success: false,
          error: 'No paramedics online',
        },
        { status: 404 }
      );
    }

    const scored = paramedics
      .map((p) => ({

        ...p,

        dist:
          p.current_lat !== null &&
          p.current_lng !== null

            ? getDistanceKm(
                ride.pickup_lat,
                ride.pickup_lng,
                p.current_lat,
                p.current_lng
              )

            : 999,

      }))

      .sort((a, b) => a.dist - b.dist);

    const bestMatch = scored[0];

    if (!bestMatch) {

      return NextResponse.json(
        {
          success: false,
          error: 'No valid paramedic found',
        },
        { status: 404 }
      );
    }

    console.log(
      '[SMART MATCH] Best Match:',
      {
        id: bestMatch.id,
        name: bestMatch.full_name,
        distance: bestMatch.dist,
      }
    );

    const {
      data: updatedRide,
      error: updateError,
    } = await supabase
      .from('rides')
      .update({
        paramedic_id: bestMatch.id,
      })
      .eq('id', request_id)
      .eq('status', 'searching')
      .select()
      .single();

    if (updateError || !updatedRide) {

      console.error(
        '[SMART MATCH] Assignment Error:',
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Ride assignment failed',
        },
        { status: 409 }
      );
    }

    console.log(
      `[SMART MATCH] Assigned ${bestMatch.full_name} to Ride ${request_id}`
    );

    return NextResponse.json({

      success: true,

      assigned_to:
        bestMatch.full_name,

      assigned_id:
        bestMatch.id,

      distance_km:
        bestMatch.dist,

      ride: updatedRide,

    });

  } catch (error: any) {

    console.error(
      '[SMART MATCH] CRITICAL ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Internal server error',
      },
      { status: 500 }
    );
  }
}