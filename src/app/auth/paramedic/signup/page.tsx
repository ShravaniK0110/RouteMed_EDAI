'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'login' | 'register';

export default function ParamedicAuth() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: trimmedPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      router.push('/paramedic/home');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError('');

    const name = regData.name.trim();
    const regPhone = regData.phone.trim();
    const vehicle = regData.vehicle.trim();

    if (!name || !regPhone || !vehicle) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/paramedic/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone: regPhone,
          vehicle,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      router.push('/paramedic/home');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="border-b border-primary/20 px-8 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center">
            <span className="text-white text-[10px] font-mono font-bold">
              RM
            </span>
          </div>
          <span className="font-semibold text-ink">RouteMed</span>
        </Link>

        <span className="text-dark/30">/</span>
        <span className="text-sm text-dark">Paramedic Portal</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
              Portal 02
            </span>

            <h1 className="text-3xl font-bold text-ink mt-1">
              Paramedic access
            </h1>

            <p className="text-dark mt-1">
              Login or register to start accepting dispatches
            </p>
          </div>

          <div className="flex mb-6 border border-primary/20 rounded-lg overflow-hidden bg-paper">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === 'login'
                  ? 'bg-ink text-white'
                  : 'text-dark/60 hover:text-dark'
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === 'register'
                  ? 'bg-ink text-white'
                  : 'text-dark/60 hover:text-dark'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-accent/10 border border-accent/20 rounded-lg text-sm text-accent font-medium">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                  Registered Phone
                </label>

                <input
                  className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors font-mono"
                  placeholder="+91 98765 43210"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-ink hover:bg-primary text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>

              <p className="text-center text-sm text-dark/60">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError('');
                  }}
                  className="text-primary font-semibold underline underline-offset-2"
                >
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                  Full Name
                </label>

                <input
                  className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Rahul Deshmukh"
                  required
                  value={regData.name}
                  onChange={(e) =>
                    setRegData({
                      ...regData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                  Phone Number
                </label>

                <input
                  className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors font-mono"
                  placeholder="+91 98765 43210"
                  type="tel"
                  required
                  value={regData.phone}
                  onChange={(e) =>
                    setRegData({
                      ...regData,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-dark/60 mb-1.5">
                  Vehicle Reg. No.
                </label>

                <input
                  className="w-full px-4 py-3 bg-paper border border-primary/20 rounded-lg text-ink placeholder-dark/40 focus:outline-none focus:border-primary transition-colors font-mono"
                  placeholder="MH-12-XX-1234"
                  required
                  value={regData.vehicle}
                  onChange={(e) =>
                    setRegData({
                      ...regData,
                      vehicle: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-ink hover:bg-primary text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Registering…' : 'Create Account'}
              </button>

              <p className="text-center text-sm text-dark/60">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError('');
                  }}
                  className="text-primary font-semibold underline underline-offset-2"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}