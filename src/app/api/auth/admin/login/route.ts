import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { comparePassword, generateJWT } from '@/lib/auth';
import { apiError, apiCatchError } from '@/lib/api-error';
import { validateBody, AdminLoginSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const {
    data: body,
    error: validationError,
  }: {
    data: any;
    error: any;
  } = await validateBody(req, AdminLoginSchema);

  if (validationError) return validationError;

  try {
    const { email, password } = body;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      console.error('[ADMIN LOGIN] Login error:', error);
      return apiError('UNAUTHORIZED', 'Invalid credentials');
    }

    const isMatch = await comparePassword(
      password,
      admin.password_hash
    );

    if (!isMatch) {
      return apiError('UNAUTHORIZED', 'Invalid credentials');
    }

    const token = generateJWT({
      id: admin.id,
      role: 'admin',
      email: admin.email,
      name: admin.full_name || 'Admin',
    });

    return NextResponse.json({
      success: true,
      token,
      admin_id: admin.id,
      role: 'admin',
      message: 'Admin login successful',
    });

  } catch (err: unknown) {
    return apiCatchError(err, 'ADMIN_LOGIN');
  }
}