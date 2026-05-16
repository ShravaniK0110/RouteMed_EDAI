'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { CheckCircle2 } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function PatientTrackingPage({ params }: { params: { requestId: string } }) {
  const router = useRouter();
  const [paramedicLoc, setParamedicLoc] = useState({ lat: 0, lng: 0 });
  const [patientLoc, setPatientLoc] = useState({ lat: 0, lng: 0 });
  const [paramedicId, setParamedicId] = useState<string | null>(null);
  const [rideCompleted, setRideCompleted] = useState(false);
  const [paramedicName, setParamedicName] = useState<string>('Your paramedic');

  // 1. Fetch initial ride + paramedic data
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: ride } = await supabase
        .from('rides')
        .select('pickup_lat, pickup_lng, paramedic_id, status')
        .eq('id', params.requestId)
        .single();

      if (!ride) return;

      // If ride is already completed when page loads, go straight to rating
      if (ride.status === 'completed') {
        router.push(`/patient/rating?rideId=${params.requestId}`);
        return;
      }

      setPatientLoc({ lat: Number(ride.pickup_lat), lng: Number(ride.pickup_lng) });
      setParamedicId(ride.paramedic_id);

      if (ride.paramedic_id) {
        const { data: paramedic } = await supabase
          .from('paramedics')
          .select('current_lat, current_lng, full_name')
          .eq('id', ride.paramedic_id)
          .single();

        if (paramedic) {
          if (paramedic.full_name) setParamedicName(paramedic.full_name);
          if (paramedic.current_lat && paramedic.current_lng) {
            setParamedicLoc({
              lat: Number(paramedic.current_lat),
              lng: Number(paramedic.current_lng),
            });
          }
        }
      }
    };

    fetchInitialData();
  }, [params.requestId, router]);

  // 2. Listen for paramedic GPS updates
  useEffect(() => {
    if (!paramedicId) return;

    const gpsChannel = supabase
      .channel('paramedic_tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'paramedics',
          filter: `id=eq.${paramedicId}`,
        },
        (payload) => {
          if (payload.new?.current_lat && payload.new?.current_lng) {
            setParamedicLoc({
              lat: Number(payload.new.current_lat),
              lng: Number(payload.new.current_lng),
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(gpsChannel); };
  }, [paramedicId]);

  // 3. Listen for ride status = 'completed'
  useEffect(() => {
    const rideChannel = supabase
      .channel('ride_completion')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${params.requestId}`,
        },
        (payload) => {
          if (payload.new?.status === 'completed') {
            setRideCompleted(true);
            // Give patient 2 seconds to see the completion banner, then go to rating
            setTimeout(() => {
              router.push(`/patient/rating?rideId=${params.requestId}`);
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(rideChannel); };
  }, [params.requestId, router]);

  // Completion banner overlay
  if (rideCompleted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Ride Completed!</h2>
        <p className="text-slate-400">Taking you to the rating screen...</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-screen flex flex-col bg-slate-50">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Live Ambulance Tracking</h1>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {paramedicName} en route
        </div>
      </div>

      <div className="flex-grow bg-white rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xl relative">
        {patientLoc.lat !== 0 ? (
          <Map
            patientLat={patientLoc.lat}
            patientLng={patientLoc.lng}
            paramedicLat={paramedicLoc.lat}
            paramedicLng={paramedicLoc.lng}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          </div>
        )}
      </div>
    </div>
  );
}