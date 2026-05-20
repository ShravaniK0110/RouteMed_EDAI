export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { apiCatchError, apiError } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return apiError('BAD_REQUEST', 'Phone number is required');
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select('id, full_name, phone_number, email')
      .eq('phone_number', phone.trim())
      .single();

    if (error || !patient) {
      return apiError('UNAUTHORIZED', 'No account found with that phone number');
    }

    const token = generateJWT({
      id: patient.id,
      role: 'patient',
      name: patient.full_name,
      phone: patient.phone_number,
      email: patient.email || undefined,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: patient.id,
        role: 'patient',
        name: patient.full_name,
        phone: patient.phone_number,
      },
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'PATIENT_LOGIN');
  }
}