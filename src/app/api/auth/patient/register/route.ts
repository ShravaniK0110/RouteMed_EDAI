export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { apiCatchError, apiError } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const { name, phone, email } = await req.json();

    if (!name || !phone) {
      return apiError('BAD_REQUEST', 'Name and phone are required');
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email?.trim() || null;

    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (existingPatient) {
      return apiError('CONFLICT', 'Phone number already registered');
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert([{
        full_name: name.trim(),
        phone_number: cleanPhone,
        email: cleanEmail,
      }])
      .select()
      .single();

    if (error) throw error;

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
    return apiCatchError(err, 'PATIENT_REGISTER');
  }
}