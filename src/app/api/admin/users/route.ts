export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiCatchError } from '@/lib/api-error';

export async function GET(req: Request) {
  try {
    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        *,
        paramedics (
          full_name,
          vehicle_registration
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      rides: rides.map(ride => ({
        ...ride,
        paramedic_name: ride.paramedics?.full_name || 'Unassigned',
        vehicle: ride.paramedics?.vehicle_registration || 'N/A',
      })),
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'ADMIN_USERS');
  }
}
