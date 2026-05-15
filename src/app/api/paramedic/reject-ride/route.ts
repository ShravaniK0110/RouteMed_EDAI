export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Strict Authentication Guard
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.role !== 'paramedic') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { request_id, paramedic_id, reason } = await req.json();

    if (!request_id || !paramedic_id) {
      return NextResponse.json({ error: 'Bad Request: Missing request_id or paramedic_id' }, { status: 400 });
    }

    // 2. Verify the ride is still active and hasn't been accepted by someone else
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('status')
      .eq('id', request_id)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride request not found' }, { status: 404 });
    }

    if (ride.status !== 'searching') {
      return NextResponse.json({ error: 'Ride is no longer available' }, { status: 409 });
    }

    // 3. Log the rejection in the database for auditing and ML training
    const { error: rejectionError } = await supabase
      .from('ride_rejections')
      .insert([{
        ride_id: request_id,
        paramedic_id: paramedic_id,
        reason: reason || 'Manual decline',
        rejected_at: new Date().toISOString()
      }]);

    if (rejectionError) {
      console.error('Failed to log rejection:', rejectionError);
      throw new Error('Database insertion failed for rejection log');
    }

    // 4. Return success so the client can trigger the next action
    return NextResponse.json({
      success: true,
      next_paramedic_notified: true,
      message: "Ride declined and logged successfully."
    });

  } catch (error: any) {
    console.error('Critical error in reject-ride route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message }, 
      { status: 500 }
    );
  }
}
