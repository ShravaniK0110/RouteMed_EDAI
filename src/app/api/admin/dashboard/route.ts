import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 1. Fetch Core Stats from Supabase
    const { data: rides, error: ridesError } = await supabase.from('rides').select('*');
    const { data: paramedics, error: paraError } = await supabase.from('paramedics').select('*');
    
    // FIXED: Efficiently count the actual number of registered patients
    const { count: totalUsers, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (ridesError || paraError || patientsError) throw ridesError || paraError || patientsError;

    // 2. Calculate Active Rides
    const activeRides = rides.filter(r => 
      ['searching', 'accepted', 'en_route', 'in_transit'].includes(r.status)
    ).length;

    // 3. Calculate Online Paramedics
    const onlineParamedics = paramedics.filter(p => p.is_online).length;

    // 4. Calculate Revenue (15% platform fee)
    const completedRides = rides.filter(r => r.status === 'completed');
    const totalFare = completedRides.reduce((acc, curr) => acc + (Number(curr.total_fare) || 0), 0);
    const platformRevenue = totalFare * 0.15;

    // 5. Fetch Recent Critical Rides
    const { data: criticalRides } = await supabase
      .from('rides')
      .select('*, paramedics(full_name)')
      .eq('severity', 'Critical')
      .order('created_at', { ascending: false })
      .limit(5);

    // 6. Fetch Pending Paramedics
    const { data: pendingParamedics } = await supabase
      .from('paramedics')
      .select('*')
      .eq('is_verified', false)
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        active_rides: activeRides,
        online_paramedics: onlineParamedics,
        // FIXED: Replaced the rough estimate with the true database count
        total_users: totalUsers || 0, 
        platform_revenue: platformRevenue.toFixed(2)
      },
      recent_critical_rides: (criticalRides || []).map(r => ({
        id: r.id,
        status: r.status,
        severity: r.severity,
        paramedic: r.paramedics?.full_name || 'Unassigned'
      })),
      pending_approvals: (pendingParamedics || []).map(p => ({
        id: p.id,
        name: p.full_name,
        vehicle: p.vehicle_registration
      }))
    });

  } catch (error: any) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard', details: error.message }, { status: 500 });
  }
}