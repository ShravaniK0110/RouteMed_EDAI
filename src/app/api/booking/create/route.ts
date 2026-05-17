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
      patientId,
      pickupLat,
      pickupLng,
      hospitalId,
      severity,
    } = body;

    console.log(
      '[BOOKING CREATE] Incoming Request:',
      body
    );

    // HIGH PRIORITY FIX:
    // Required field validation

    if (
      !patientId ||
      pickupLat === undefined ||
      pickupLng === undefined ||
      !hospitalId
    ) {

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // HIGH PRIORITY FIX:
    // Ensure logged-in user matches booking user

    if (
      user.id !== patientId &&
      user.role !== 'admin'
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'You cannot create rides for another user',
        },
        { status: 403 }
      );
    }

    // HIGH PRIORITY FIX:
    // Only patients can create bookings

    if (
      user.role !== 'patient' &&
      user.role !== 'admin'
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Only patients can request ambulances',
        },
        { status: 403 }
      );
    }

    // HIGH PRIORITY FIX:
    // Validate coordinates

    if (
      typeof pickupLat !== 'number' ||
      typeof pickupLng !== 'number'
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Coordinates must be numbers',
        },
        { status: 400 }
      );
    }

    if (
      pickupLat < -90 ||
      pickupLat > 90 ||
      pickupLng < -180 ||
      pickupLng > 180
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

    // HIGH PRIORITY FIX:
    // Validate severity

    const allowedSeverities = [
      'Low',
      'Medium',
      'High',
      'Critical',
    ];

    if (
      severity &&
      !allowedSeverities.includes(severity)
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid severity level',
        },
        { status: 400 }
      );
    }

    // HIGH PRIORITY FIX:
    // Ensure patient exists

    const {
      data: patient,
      error: patientError,
    } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', patientId)
      .single();

    if (
      patientError ||
      !patient
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Patient not found',
        },
        { status: 404 }
      );
    }

    // HIGH PRIORITY FIX:
    // Ensure hospital exists

    const {
      data: hospital,
      error: hospitalError,
    } = await supabase
      .from('hospitals')
      .select('id')
      .eq('id', hospitalId)
      .single();

    if (
      hospitalError ||
      !hospital
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Hospital not found',
        },
        { status: 404 }
      );
    }

    // HIGH PRIORITY FIX:
    // Prevent duplicate active rides

    const {
      data: existingRide,
    } = await supabase
      .from('rides')
      .select('id, status')
      .eq('patient_id', patientId)
      .in('status', [
        'searching',
        'accepted',
        'ongoing',
      ])
      .maybeSingle();

    if (existingRide) {

      return NextResponse.json(
        {
          success: false,
          error:
            'Patient already has an active ride',
        },
        { status: 409 }
      );
    }

    // Create ride

    const {
      data: ride,
      error: rideError,
    } = await supabase
      .from('rides')
      .insert([
        {
          patient_id: patientId,

          hospital_id: hospitalId,

          pickup_lat: pickupLat,

          pickup_lng: pickupLng,

          status: 'searching',

          severity:
            severity || 'Medium',
        },
      ])
      .select()
      .single();

    if (rideError) {

      console.error(
        '[BOOKING CREATE] Ride Insert Error:',
        rideError
      );

      throw rideError;
    }

    console.log(
      '[BOOKING CREATE] Ride Created:',
      ride
    );

    // Create hospital alert

    const {
      error: alertError,
    } = await supabase
      .from('hospital_alerts')
      .insert([
        {
          ride_id: ride.id,

          hospital_id: hospitalId,

          severity:
            severity || 'Medium',
        },
      ]);

    if (alertError) {

      console.error(
        '[BOOKING CREATE] Hospital Alert Error:',
        alertError
      );
    }

    return NextResponse.json({
      success: true,
      rideId: ride.id,
    });

  } catch (error: any) {

    console.error(
      '[BOOKING CREATE] CRITICAL ERROR:',
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