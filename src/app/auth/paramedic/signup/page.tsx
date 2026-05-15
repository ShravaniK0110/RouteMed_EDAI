'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ParamedicSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', phone: '', vehicle: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('paramedics')
        .insert([{ 
          full_name: formData.name, 
          phone_number: formData.phone, 
          vehicle_registration: formData.vehicle,
          is_online: false 
        }])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('user', JSON.stringify({ 
        id: data.id, 
        role: 'paramedic',
        name: data.full_name 
      }));

      router.push('/paramedic/home');
    } catch (err: any) {
      alert("Registration Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 text-white rounded-xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6">Paramedic Onboarding</h1>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <input className="w-full p-3 border rounded-lg" placeholder="Full Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
        <input className="w-full p-3 border rounded-lg" placeholder="Phone Number" required onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        <input className="w-full p-3 border rounded-lg" placeholder="Vehicle Reg Number (e.g. MH-12-XX-1234)" required onChange={(e) => setFormData({...formData, vehicle: e.target.value})} />
        <button disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold">
          {loading ? 'Registering...' : 'Start Duty'}
        </button>
      </form>
    </div>
  );
}