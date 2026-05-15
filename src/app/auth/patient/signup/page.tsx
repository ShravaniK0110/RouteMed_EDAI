'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PatientSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{ 
          full_name: formData.name, 
          phone_number: formData.phone, 
          email: formData.email 
        }])
        .select()
        .single();

      if (error) throw error;

      // Store REAL data for the booking page to use
      localStorage.setItem('user', JSON.stringify({ 
        id: data.id, 
        role: 'patient',
        name: data.full_name 
      }));

      router.push('/patient/book');
    } catch (err: any) {
      alert("Signup Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-md border">
      <h1 className="text-2xl font-bold mb-6">Patient Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          className="w-full p-3 border rounded-lg" 
          placeholder="Full Name" 
          required
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
        <input 
          className="w-full p-3 border rounded-lg" 
          placeholder="Phone Number" 
          required
          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
        />
        <input 
          className="w-full p-3 border rounded-lg" 
          placeholder="Email (Optional)" 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
    </div>
  );
}