export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuthHeader } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, UpdateLocationSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const user       = verifyAuthHeader(authHeader);
  if (!user) return apiError('UNAUTHORIZED', 'Unauthorized');

  const { data: body, error: validationError } = await validateBody(req, UpdateLocationSchema);
  if (validationError) return validationError;

  try {
    const { paramedic_id, latitude, longitude } = body;

    if (user.id !== paramedic_id && user.role !== 'admin') {
      return apiError('FORBIDDEN', 'You cannot update another paramedic location');
    }

    const { data: paramedic, error: fetchError } = await supabase
      .from('paramedics')
      .select('id')
      .eq('id', paramedic_id)
      .single();

    if (fetchError || !paramedic) {
      return apiError('NOT_FOUND', 'Paramedic not found');
    }

    const { error: updateError } = await supabase
      .from('paramedics')
      .update({
        current_lat: latitude,
        current_lng: longitude,
        is_online:   true,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', paramedic_id);

    if (updateError) {
      console.error('[LOCATION UPDATE ERROR]', updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, paramedic_id, latitude, longitude });

  } catch (err: unknown) {
    return apiCatchError(err, 'UPDATE_LOCATION');
  }
}
