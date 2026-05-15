export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    // 1. Fetch accuracy records from Supabase
    const { data, error } = await supabase
      .from('prediction_accuracy')
      .select('accuracy_percent')

    if (error) {
      throw error;
    }

    let accuracy = 0;
    let count = data ? data.length : 0;

    // 2. Calculate the real average only if data exists
    if (count > 0) {
      const sum = data.reduce((acc, row) => acc + (Number(row.accuracy_percent) || 0), 0);
      accuracy = sum / count;
    }

    // 3. Return the exact database stats
    return NextResponse.json({
        success: true,
        accuracy: accuracy.toFixed(1),
        count: count,
        last_updated: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching ML stats:', error)
    
    // Return a strict 500 error if the database call fails
    return NextResponse.json(
      { error: 'Failed to fetch ML stats', details: error.message }, 
      { status: 500 }
    )
  }
}