export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  context: {
    params: {
      rideId: string;
    };
  }
) {

  try {

    const rideId =
      context.params.rideId;

    // FETCH RIDE FROM SUPABASE
    const {
      data: ride,
      error
    } = await supabase
      .from('rides')
      .select(`
        *,
        hospitals (
          id,
          name,
          latitude,
          longitude,
          address
        ),
        paramedics (
          id,
          name,
          phone,
          current_lat,
          current_lng,
          is_online
        )
      `)
      .eq('id', rideId)
      .single();

    if (
      error ||
      !ride
    ) {

      console.error(
        '[RIDE FETCH ERROR]',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Ride not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ride,
    });

  } catch (error: any) {

    console.error(
      '[RIDE API ERROR]',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Failed to fetch ride',
      },
      { status: 500 }
    );
  }
}