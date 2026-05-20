export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateJWT } from '@/lib/auth';
import { apiCatchError, apiError } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      vehicle,
    } = body;

    // Validation
    if (!name || !phone || !vehicle) {
      return apiError(
        'BAD_REQUEST',
        'All fields are required'
      );
    }

    const cleanPhone =
      phone.trim();

    // SERVER-SIDE DUPLICATE CHECK
    const {
      data: existingParamedic,
      error: existingError,
    } = await supabase
      .from('paramedics')
      .select('id')
      .eq(
        'phone_number',
        cleanPhone
      )
      .maybeSingle();

    if (existingError) {
      console.error(
        '[PARAMEDIC REGISTER] Duplicate Check Error:',
        existingError
      );

      throw existingError;
    }

    if (existingParamedic) {
      return apiError(
        'CONFLICT',
        'Phone number already registered'
      );
    }

    // CREATE PARAMEDIC
    const {
      data: newParamedic,
      error: insertError,
    } = await supabase
      .from('paramedics')
      .insert([
        {
          full_name: name.trim(),
          phone_number: cleanPhone,
          vehicle_registration:
            vehicle.trim(),
          is_online: false,
          rating: 5,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error(
        '[PARAMEDIC REGISTER] Insert Error:',
        insertError
      );

      throw insertError;
    }

    // GENERATE JWT
    const token = generateJWT({
      id: newParamedic.id,
      role: 'paramedic',
      name: newParamedic.full_name,
      phone:
        newParamedic.phone_number,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newParamedic.id,
        role: 'paramedic',
        name: newParamedic.full_name,
        phone:
          newParamedic.phone_number,
      },
    });

  } catch (err: unknown) {
    return apiCatchError(
      err,
      'PARAMEDIC_REGISTER'
    );
  }
}