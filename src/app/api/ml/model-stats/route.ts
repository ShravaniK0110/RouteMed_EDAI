export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiCatchError } from '@/lib/api-error';

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from('prediction_accuracy')
      .select('accuracy_percent');

    if (error) throw error;

    const count = data ? data.length : 0;
    let accuracy = 0;

    if (count > 0) {
      const sum = data.reduce((acc, row) => acc + (Number(row.accuracy_percent) || 0), 0);
      accuracy = sum / count;
    }

    return NextResponse.json({
      success: true,
      accuracy: accuracy.toFixed(1),
      count,
      last_updated: new Date().toISOString(),
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'ML_STATS');
  }
}
