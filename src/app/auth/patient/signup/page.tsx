'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        .insert([{ full_name: formData.name, phone_number: formData.phone, email: formData.email }])
        .select()
        .single();
      if (error) throw error;
      localStorage.setItem('user', JSON.stringify({ id: data.id, role: 'patient', name: data.full_name }));
      router.push('/patient/book');
    } catch (err: any) {
      alert("Signup Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="border-b border-primary/20 px-8 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center">
            <span className="text-white text-[10px] font-mono font-bold">RM</span>
          </div>
          <span className="font-semibold text-ink">RouteMed</span>
        </Link>
        <span className="text-dark/30">/</span>
        <span className="text-sm text-dark">Patient Registration</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Portal 01</span>
            <h1 className="text-3xl font-bold text-ink mt-1">Create account</h1>
            <p className="text-dark mt-1">Register to book emergency transport</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">Full Name</label>
              <input
                className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. Priya Sharma"
                required
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">Phone Number</label>
              <input
                className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors font-mono"
                placeholder="+91 98765 43210"
                type="tel"
                required
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                Email <span className="text-dark/40 normal-case font-sans font-normal">(optional)</span>
              </label>
              <input
                className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
                type="email"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full mt-2 py-3.5 bg-ink hover:bg-primary text-white font-bold rounded-lg transition-colors disabled:opacity-50 tracking-wide"
            >
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <p className="text-center text-xs text-dark/50 mt-6 font-mono">
            Emergency only? Takes 10 seconds.
          </p>
        </div>
      </main>
    </div>
  );
}