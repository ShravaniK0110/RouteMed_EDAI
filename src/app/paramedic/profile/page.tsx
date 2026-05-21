'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Phone, Truck, LogOut } from 'lucide-react';

type ParamedicProfile = {
  full_name: string;
  phone_number: string;
  vehicle_registration: string;
};

export default function ParamedicProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ParamedicProfile>({
    full_name: '',
    phone_number: '',
    vehicle_registration: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userStr = localStorage.getItem('user');

        if (!userStr) {
          router.push('/auth/paramedic/signup');
          return;
        }

        const user = JSON.parse(userStr);
        const paramedicId = user.id || user.paramedic_id || user.user_id;

        if (!paramedicId) {
          router.push('/auth/paramedic/signup');
          return;
        }

        const { data, error } = await supabase
          .from('paramedics')
          .select('full_name, phone_number, vehicle_registration')
          .eq('id', paramedicId)
          .single();

        if (error) {
          console.error('[PARAMEDIC PROFILE LOAD ERROR]', error);
          setProfile({
            full_name: user.name || 'Paramedic',
            phone_number: user.phone || 'Not available',
            vehicle_registration: 'Not available',
          });
          return;
        }

        setProfile({
          full_name: data?.full_name || 'Paramedic',
          phone_number: data?.phone_number || 'Not available',
          vehicle_registration: data?.vehicle_registration || 'Not available',
        });
      } catch (err) {
        console.error('[PARAMEDIC PROFILE ERROR]', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/auth/paramedic/signup');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-secondary">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
            Portal 02
          </p>
          <h1 className="text-3xl font-bold text-ink mt-1">
            Paramedic Profile
          </h1>
          <p className="text-dark mt-1">
            Basic account information
          </p>
        </div>

        <div className="bg-paper border border-primary/20 rounded-2xl shadow-warm p-6">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-dark/60 mb-1">
                  Name
                </p>
                <p className="text-lg font-bold text-ink">
                  {profile.full_name}
                </p>
              </div>
            </div>

            <div className="border-t border-primary/10"></div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-dark/60 mb-1">
                  Phone Number
                </p>
                <p className="text-lg font-bold text-ink">
                  {profile.phone_number}
                </p>
              </div>
            </div>

            <div className="border-t border-primary/10"></div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-dark/60 mb-1">
                  Vehicle Number
                </p>
                <p className="text-lg font-bold text-ink">
                  {profile.vehicle_registration}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-red-700 text-white font-bold transition-colors shadow-warm"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}