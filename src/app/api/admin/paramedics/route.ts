export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    // 1. Fetch paramedics from the new Supabase table
    const { data: paramedics, error } = await supabase
      .from('paramedics')
      .select('*')
      .order('is_online', { ascending: false });

    if (error) throw error;

    // 2. Return the data in a format the dashboard expects
    return NextResponse.json(paramedics);
  } catch (error: any) {
    console.error('Admin Paramedics Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paramedics' },
      { status: 500 }
    );
  }
}