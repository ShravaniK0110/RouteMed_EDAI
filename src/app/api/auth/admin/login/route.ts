import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; 
import { comparePassword, generateJWT } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Fetch admin record from Supabase 'admins' table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    // 2. Handle missing admin or database error
    if (error || !admin) {
      console.error('Login error:', error);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Verify the password hash
    const isMatch = await comparePassword(password, admin.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 4. Generate the JWT for the admin session
    const token = generateJWT({ admin_id: admin.id, role: 'admin' });

    return NextResponse.json({
      success: true,
      token,
      admin_id: admin.id,
      role: 'admin',
      message: 'Admin login successful'
    });

  } catch (error: any) {
    console.error('Error logging in admin:', error);
    return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
  }
}