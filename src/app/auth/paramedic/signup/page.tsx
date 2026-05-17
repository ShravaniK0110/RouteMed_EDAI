'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Tab = 'login' | 'register';

export default function ParamedicAuth() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [phone, setPhone] = useState('');

  // Register form
  const [regData, setRegData] = useState({
    name: '',
    phone: '',
    vehicle: '',
  });

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (loading) return;
  setError('');

  const trimmedPhone = phone.trim();
  if (!trimmedPhone) {
    setError('Please enter your phone number');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/api/auth/paramedic/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: trimmedPhone }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setError(data.error || 'Login failed');
      return;
    }

    // Store both user info AND token
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);

    router.push('/paramedic/home');
  } catch (err: any) {
    console.error('[PARAMEDIC LOGIN] Error:', err);
    setError('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const { name, phone: regPhone, vehicle } = regData;

    if (!name.trim() || !regPhone.trim() || !vehicle.trim()) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Check for existing paramedic with same phone — prevent duplicates
      const { data: existing } = await supabase
        .from('paramedics')
        .select('id')
        .eq('phone_number', regPhone.trim())
        .maybeSingle();

      if (existing) {
        setError('A paramedic with this phone number already exists. Please log in instead.');
        setTab('login');
        setPhone(regPhone.trim());
        return;
      }

      const { data, error: insertError } = await supabase
        .from('paramedics')
        .insert([
          {
            full_name: name.trim(),
            phone_number: regPhone.trim(),
            vehicle_registration: vehicle.trim(),
            is_online: false,
            rating: 5,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      localStorage.setItem(
        'user',
        JSON.stringify({
          id: data.id,
          role: 'paramedic',
          name: data.full_name,
        })
      );

      router.push('/paramedic/home');
    } catch (err: any) {
      console.error('[PARAMEDIC REGISTER] Error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 text-white rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-2">Paramedic Portal</h1>
      <p className="text-sm text-slate-400 mb-6">Login or register to access your dashboard</p>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border border-slate-700 mb-6">
        <button
          onClick={() => { setTab('login'); setError(''); }}
          className={`flex-1 py-2 text-sm font-bold transition-colors ${
            tab === 'login' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => { setTab('register'); setError(''); }}
          className={`flex-1 py-2 text-sm font-bold transition-colors ${
            tab === 'register' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-600 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full p-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400"
            placeholder="Registered Phone Number"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-center text-sm text-slate-400">
            New paramedic?{' '}
            <button
              type="button"
              onClick={() => setTab('register')}
              className="text-green-400 underline"
            >
              Register here
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            className="w-full p-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400"
            placeholder="Full Name"
            required
            value={regData.name}
            onChange={(e) => setRegData({ ...regData, name: e.target.value })}
          />
          <input
            className="w-full p-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400"
            placeholder="Phone Number"
            type="tel"
            required
            value={regData.phone}
            onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
          />
          <input
            className="w-full p-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400"
            placeholder="Vehicle Reg Number (e.g. MH-12-XX-1234)"
            required
            value={regData.vehicle}
            onChange={(e) => setRegData({ ...regData, vehicle: e.target.value })}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => setTab('login')}
              className="text-green-400 underline"
            >
              Login here
            </button>
          </p>
        </form>
      )}
    </div>
  );
}