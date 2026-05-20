import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = (body.phone || '').trim();

    if (!phone) {
      return apiError('BAD_REQUEST', 'Phone number is required');
    }

    const { data: paramedic, error } = await supabase
      .from('paramedics')
      .select('id, full_name, phone_number, vehicle_registration, is_verified')
      .eq('phone_number', phone)
      .single();

    if (error || !paramedic) {
      return apiError('UNAUTHORIZED', 'No account found with that phone number');
    }

    const token = generateJWT({
      id: paramedic.id,
      role: 'paramedic',
      name: paramedic.full_name,
      phone: paramedic.phone_number,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: paramedic.id,
        role: 'paramedic',
        name: paramedic.full_name,
        vehicle: paramedic.vehicle_registration,
        is_verified: paramedic.is_verified,
      },
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'PARAMEDIC_LOGIN');
  }
}