export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, RejectRideSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiError('UNAUTHORIZED', 'Missing or invalid token format');
  }

  const token   = authHeader.split(' ')[1];
  const decoded = verifyJWT(token);
  if (!decoded || decoded.role !== 'paramedic') {
    return apiError('FORBIDDEN', 'Insufficient permissions');
  }

  const { data: body, error: validationError } = await validateBody(req, RejectRideSchema);
  if (validationError) return validationError;

  try {
    const { request_id, paramedic_id, reason } = body;

    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('status')
      .eq('id', request_id)
      .single();

    if (rideError || !ride) return apiError('NOT_FOUND', 'Ride request not found');
    if (ride.status !== 'searching') return apiError('CONFLICT', 'Ride is no longer available');

    const { error: rejectionError } = await supabase
      .from('ride_rejections')
      .insert([{
        ride_id:     request_id,
        paramedic_id,
        reason:      reason || 'Manual decline',
        rejected_at: new Date().toISOString(),
      }]);

    if (rejectionError) {
      console.error('Failed to log rejection:', rejectionError);
      throw new Error('Database insertion failed for rejection log');
    }

    return NextResponse.json({
      success:                true,
      next_paramedic_notified: true,
      message:                'Ride declined and logged successfully.',
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'REJECT_RIDE');
  }
}
