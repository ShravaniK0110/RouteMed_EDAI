'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mode = 'signup' | 'login';

export default function PatientAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signup');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Coerce empty email string → null to avoid unique constraint on blank emails
        const emailValue = formData.email.trim() === '' ? null : formData.email.trim();

        const { data, error: insertError } = await supabase
          .from('patients')
          .insert([{
            full_name: formData.name.trim(),
            phone_number: formData.phone.trim(),
            email: emailValue,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          role: 'patient',
          name: data.full_name,
        }));
        router.push('/patient/book');

      } else {
        // Login: look up by phone number
        const { data, error: fetchError } = await supabase
          .from('patients')
          .select('id, full_name, phone_number')
          .eq('phone_number', formData.phone.trim())
          .single();

        if (fetchError || !data) {
          throw new Error('No account found with that phone number.');
        }

        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          role: 'patient',
          name: data.full_name,
        }));
        router.push('/patient/home');
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
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
        <span className="text-sm text-dark">Patient Portal</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Portal 01</span>
            <h1 className="text-3xl font-bold text-ink mt-1">
              {mode === 'signup' ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-dark mt-1">
              {mode === 'signup'
                ? 'Register to book emergency transport'
                : 'Login with your registered phone number'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-paper border border-primary/15 rounded-xl overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-black to-zinc-900 text-white'
                  : 'text-dark/40 hover:text-dark'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-black to-zinc-900 text-white'
                  : 'text-dark/40 hover:text-dark'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                  Full Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Priya Sharma"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            {/* Phone — always shown */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                Phone Number
              </label>
              <input
                className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors font-mono"
                placeholder="+91 98765 43210"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Email — signup only, optional */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                  Email <span className="text-dark/40 normal-case font-sans font-normal">(optional)</span>
                </label>
                <input
                  className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@example.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-black to-zinc-900 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold transition-all mt-2"
            >
              {loading
                ? (mode === 'signup' ? 'Creating account…' : 'Logging in…')
                : (mode === 'signup' ? 'Create Account' : 'Login')}
            </button>
          </form>

          <p className="text-center text-xs text-dark/40 mt-6">
            {mode === 'signup'
              ? 'Already registered? '
              : 'New here? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
              className="text-primary font-bold hover:underline"
            >
              {mode === 'signup' ? 'Login instead' : 'Create account'}
            </button>
          </p>
        </div>
      </main>

      <footer className="border-t border-primary/10 px-8 py-4 text-center">
        <span className="text-xs text-dark/40 font-mono">Built for Pune</span>
      </footer>
    </div>
  );
}