export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/middleware/auth';

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { ride_id, reason } = body;

    if (!ride_id) {
      return NextResponse.json(
        { success: false, error: 'Missing ride_id' },
        { status: 400 }
      );
    }

    // Fetch current ride
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('id, status, patient_id, paramedic_id')
      .eq('id', ride_id)
      .single();

    if (fetchError || !ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 }
      );
    }

    // Only cancellable if not already completed/cancelled
    const nonCancellableStatuses = ['completed', 'cancelled_by_patient', 'cancelled_by_paramedic'];
    if (nonCancellableStatuses.includes(ride.status)) {
      return NextResponse.json(
        { success: false, error: `Ride is already ${ride.status}` },
        { status: 409 }
      );
    }

    // Determine who is cancelling and set correct status
    let cancelStatus = 'cancelled_by_patient';
    if (auth.role === 'paramedic') {
      if (auth.id !== ride.paramedic_id) {
        return NextResponse.json(
          { success: false, error: 'You are not assigned to this ride' },
          { status: 403 }
        );
      }
      cancelStatus = 'cancelled_by_paramedic';
    } else if (auth.role === 'patient') {
      if (auth.id !== ride.patient_id) {
        return NextResponse.json(
          { success: false, error: 'This is not your ride' },
          { status: 403 }
        );
      }
    }
    // admin can cancel any ride, keeps cancelStatus as 'cancelled_by_patient' (or add 'cancelled_by_admin')

    // Cancel the ride
    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({
        status: cancelStatus,
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || null,
      })
      .eq('id', ride_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If a paramedic was assigned, put them back online
    if (ride.paramedic_id) {
      const { error: paramedicError } = await supabase
        .from('paramedics')
        .update({ is_online: true })
        .eq('id', ride.paramedic_id);

      if (paramedicError) {
        console.error('[CANCEL] Failed to restore paramedic online status:', paramedicError);
      }
    }

    console.log(`[CANCEL] Ride ${ride_id} cancelled — status: ${cancelStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Ride cancelled successfully',
      ride: updatedRide,
    });

  } catch (err: any) {
    console.error('[CANCEL RIDE] CRITICAL ERROR:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}