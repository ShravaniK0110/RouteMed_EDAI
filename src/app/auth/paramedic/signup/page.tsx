'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ParamedicSignup() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {

      if (
        !formData.name ||
        !formData.phone ||
        !formData.vehicle
      ) {
        alert('Please fill all fields');
        return;
      }

      const { data: existingParamedic, error: existingError } =
        await supabase
          .from('paramedics')
          .select('*')
          .eq('phone_number', formData.phone)
          .single();

      if (existingParamedic) {

        console.log(
          '[PARAMEDIC AUTH] Existing paramedic found:',
          existingParamedic
        );

        localStorage.setItem(
          'user',
          JSON.stringify({
            id: existingParamedic.id,
            role: 'paramedic',
            name: existingParamedic.full_name,
          })
        );

        router.push('/paramedic/home');

        return;
      }

      if (
        existingError &&
        existingError.code !== 'PGRST116'
      ) {
        throw existingError;
      }

      const { data, error } = await supabase
        .from('paramedics')
        .insert([
          {
            full_name: formData.name.trim(),
            phone_number: formData.phone.trim(),
            vehicle_registration: formData.vehicle.trim(),
            is_online: false,
            rating: 5,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(
        '[PARAMEDIC AUTH] New paramedic created:',
        data
      );

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

      console.error(
        '[PARAMEDIC AUTH] ERROR:',
        err
      );

      alert(
        'Authentication Failed: ' +
          (err.message || 'Unknown error')
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 text-white rounded-xl shadow-xl">

      <h1 className="text-2xl font-bold mb-2">
        Paramedic Onboarding
      </h1>

      <p className="text-sm text-slate-300 mb-6">
        Existing paramedics can log in using the same phone number.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 text-black"
      >

        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Full Name"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value,
            })
          }
        />

        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Phone Number"
          required
          value={formData.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone: e.target.value,
            })
          }
        />

        <input
          className="w-full p-3 border rounded-lg"
          placeholder="Vehicle Reg Number (e.g. MH-12-XX-1234)"
          required
          value={formData.vehicle}
          onChange={(e) =>
            setFormData({
              ...formData,
              vehicle: e.target.value,
            })
          }
        />

        <button
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? 'Please wait...' : 'Continue'}
        </button>

      </form>
    </div>
  );
}