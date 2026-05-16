export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { latitude, longitude, paramedic_id } = body;

    // Fix 2: Validation for correct fields
    if (!latitude || !longitude || !paramedic_id) {
      return NextResponse.json({ error: 'Missing latitude, longitude, or paramedic_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('paramedics')
      .update({ 
        current_lat: latitude, 
        current_lng: longitude, 
        is_online: true 
      })
      .eq('id', paramedic_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}