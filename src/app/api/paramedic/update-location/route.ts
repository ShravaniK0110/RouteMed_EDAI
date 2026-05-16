export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

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

    const {
      latitude,
      longitude,
      paramedic_id,
    } = body;

    console.log(
      '[LOCATION UPDATE]',
      body
    );

    if (
      latitude === undefined ||
      longitude === undefined ||
      !paramedic_id
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Missing latitude, longitude, or paramedic_id',
        },
        { status: 400 }
      );
    }

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number'
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Latitude and longitude must be numbers',
        },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid GPS coordinates',
        },
        { status: 400 }
      );
    }

    if (
      user.id !== paramedic_id &&
      user.role !== 'admin'
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'You cannot update another paramedic location',
        },
        { status: 403 }
      );
    }

    const {
      data: paramedic,
      error: fetchError,
    } = await supabase
      .from('paramedics')
      .select('*')
      .eq('id', paramedic_id)
      .single();

    if (fetchError || !paramedic) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Paramedic not found',
        },
        { status: 404 }
      );
    }

    const {
      error: updateError,
    } = await supabase
      .from('paramedics')
      .update({

        current_lat: latitude,

        current_lng: longitude,

        is_online: true,

        updated_at:
          new Date().toISOString(),

      })
      .eq('id', paramedic_id);

    if (updateError) {

      console.error(
        '[LOCATION UPDATE ERROR]',
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({

      success: true,

      paramedic_id,

      latitude,

      longitude,

    });

  } catch (err: any) {

    console.error(
      '[LOCATION API ERROR]',
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          'Internal server error',
      },
      { status: 500 }
    );
  }
}