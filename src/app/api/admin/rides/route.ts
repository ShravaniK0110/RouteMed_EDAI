export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyJWT } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Strict Admin Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyJWT(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch rides via Supabase instead of Prisma
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
      throw new Error('Database query failed');
    }

    return NextResponse.json({ 
      success: true, 
      rides: rides.map(ride => ({
        ...ride,
        paramedic_name: ride.paramedics?.full_name || 'Unassigned',
        vehicle: ride.paramedics?.vehicle_registration || 'N/A'
      }))
    });

  } catch (error: any) {
    console.error('Error fetching global rides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rides', details: error.message }, 
      { status: 500 }
    );
  }
}