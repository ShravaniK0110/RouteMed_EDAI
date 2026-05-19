export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, RejectRideSchema } from '@/lib/validation';

export async function POST(req: Request) {

  // AUTH CHECK
  const authHeader = req.headers.get('authorization');

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return apiError(
      'UNAUTHORIZED',
      'Missing or invalid token format'
    );
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyJWT(token);

  if (
    !decoded ||
    decoded.role !== 'paramedic'
  ) {
    return apiError(
      'FORBIDDEN',
      'Insufficient permissions'
    );
  }

  // VALIDATION
const validationResult: any =
  await validateBody(
    req,
    RejectRideSchema
  );

const body = validationResult.data;

const validationError =
  validationResult.error;

  if (validationError) {
    return validationError;
  }

  try {

    const {
      request_id,
      paramedic_id,
      reason
    } = body;

    console.log(
      '[REJECT RIDE] Incoming:',
      body
    );

    // FIND RIDE
    const {
      data: ride,
      error: rideError
    } = await supabase
      .from('rides')
      .select('*')
      .eq('id', request_id)
      .single();

    if (
      rideError ||
      !ride
    ) {

      return apiError(
        'NOT_FOUND',
        'Ride request not found'
      );
    }

    // ONLY SEARCHING RIDES CAN BE REJECTED
    if (
      ride.status !== 'searching'
    ) {

      return apiError(
        'CONFLICT',
        'Ride is no longer available'
      );
    }

    // LOG REJECTION
    const {
      error: rejectionError
    } = await supabase
      .from('ride_rejections')
      .insert([
        {
          ride_id: request_id,
          paramedic_id,
          reason:
            reason ||
            'Manual decline',

          rejected_at:
            new Date().toISOString(),
        }
      ]);

    if (rejectionError) {

      console.error(
        '[REJECTION LOG ERROR]',
        rejectionError
      );

      throw new Error(
        'Failed to log rejection'
      );
    }

    // IMPORTANT FIX:
    // RESET RIDE SO IT CAN BE REASSIGNED

    const {
      error: resetError
    } = await supabase
      .from('rides')
      .update({
        paramedic_id: null,
        status: 'searching',
      })
      .eq('id', request_id);

    if (resetError) {

      console.error(
        '[RIDE RESET ERROR]',
        resetError
      );

      throw new Error(
        'Failed to reset ride'
      );
    }

    console.log(
      '[REJECT RIDE] Success:',
      request_id
    );

    return NextResponse.json({
      success: true,

      next_paramedic_notified: true,

      message:
        'Ride rejected and reset successfully.',
    });

  } catch (err: unknown) {

    return apiCatchError(
      err,
      'REJECT_RIDE'
    );
  }
}