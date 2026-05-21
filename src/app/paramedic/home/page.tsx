'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Power, AlertTriangle, Navigation, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/useNotification';

const Map = dynamic<any>(() => import('@/components/Map'), { ssr: false });

export default function ParamedicHome() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [paramedicId, setParamedicId] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState({ lat: 18.5204, lng: 73.8567 });

  // Ref guard — prevents double-accept if user taps twice fast
  const isAccepting = useRef(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth/paramedic/signup');
      return;
    }
    const user = JSON.parse(userStr);
    const id = user.id || user.paramedic_id || user.user_id;
    setParamedicId(id);
  }, [router]);

  // GPS watcher — updates DB directly (paramedic home doesn't have a JWT token,
  // so we write to Supabase directly here; update-location API used in active-ride)
  useEffect(() => {
    if (!isOnline || !paramedicId || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });

        const { error } = await supabase
          .from('paramedics')
          .update({ current_lat: latitude, current_lng: longitude, is_online: true })
          .eq('id', paramedicId);

        if (error) console.error('[GPS] DB sync error:', error.message);
      },
      (err) => console.error('[GPS] Error:', err.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, paramedicId]);

  // Poll for incoming rides assigned to this paramedic
  useEffect(() => {
    if (!isOnline || !paramedicId || incomingRide) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('paramedic_id', paramedicId)
        .eq('status', 'searching')
        .limit(1);

      if (data && data.length > 0) {
        setIncomingRide(data[0]);
        new Audio('/emergency_alert.mp3').play().catch(() => {});
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOnline, paramedicId, incomingRide]);

  const toggleStatus = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    if (paramedicId) {
      await supabase
        .from('paramedics')
        .update({ is_online: nextStatus })
        .eq('id', paramedicId);
    }
  };

  const { latestNotification } = useNotifications(paramedicId);

  const acceptRide = async () => {
    if (!incomingRide || !paramedicId) return;
    // Hard guard against double-tap
    if (isAccepting.current) return;
    isAccepting.current = true;
    setActionLoading('accept');

    try {
      const res = await fetch('/api/paramedic/accept-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: incomingRide.id,
          paramedic_id: paramedicId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Ride was taken by someone else or already gone — clear it silently
        if (res.status === 409) {
          setIncomingRide(null);
          return;
        }
        throw new Error(data.error || 'Accept failed');
      }

      router.push(`/paramedic/active-ride/${incomingRide.id}`);
    } catch (err: any) {
      console.error('[ACCEPT] Error:', err.message);
      alert('Could not accept ride: ' + err.message);
      isAccepting.current = false;
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRide = async () => {
    if (!incomingRide || !paramedicId) return;
    setActionLoading('reject');

    try {
      // Unassign the paramedic from this ride so smart-match can try another
      const { error } = await supabase
        .from('rides')
        .update({ paramedic_id: null })
        .eq('id', incomingRide.id)
        .eq('status', 'searching');

      if (error) throw error;

      setIncomingRide(null);
    } catch (err: any) {
      console.error('[REJECT] Error:', err.message);
      alert('Could not reject ride: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 bg-slate-950 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold italic tracking-tighter">COMMAND CENTER</h1>
          <p className={`text-xs font-black ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? '● UPLINK ACTIVE' : '○ UPLINK OFFLINE'}
          </p>
        </div>
        <button
          onClick={toggleStatus}
          className={`px-8 py-3 rounded-xl font-black transition-all ${
            isOnline ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'bg-green-600'
          }`}
        >
          <Power className="inline mr-2" />
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

      {latestNotification && !incomingRide && (
  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
    <p className="text-xs font-black uppercase tracking-widest text-red-400">
      Live Notification
    </p>
    <p className="text-sm font-bold text-white mt-1">
      {latestNotification.title}
    </p>
    <p className="text-xs text-slate-300 mt-1">
      {latestNotification.body}
    </p>
  </div>
)}

      <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
        {isOnline ? (
          <Map
            patientLat={incomingRide?.pickup_lat || currentPos.lat}
            patientLng={incomingRide?.pickup_lng || currentPos.lng}
            paramedicLat={currentPos.lat}
            paramedicLng={currentPos.lng}
          />
        ) : (
          <div className="text-center opacity-20">
            <Navigation className="h-16 w-16 mx-auto mb-2" />
            <p className="font-black text-xs uppercase tracking-widest">GPS Standby</p>
          </div>
        )}

        {incomingRide && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border-t-8 border-red-600 rounded-[3rem] p-10 w-full max-w-sm shadow-2xl">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-3xl font-black mb-2 italic">NEW EMERGENCY</h3>
              <p className="text-slate-400 font-bold mb-2 uppercase text-sm tracking-widest">
                {incomingRide.emergency_type || 'Medical Emergency'}
              </p>
              <p className="text-slate-500 text-xs mb-8">
                Severity: {incomingRide.severity || 'Unknown'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={rejectRide}
                  disabled={actionLoading !== null}
                  className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X className="h-5 w-5" />
                  {actionLoading === 'reject' ? '...' : 'REJECT'}
                </button>
                <button
                  onClick={acceptRide}
                  disabled={actionLoading !== null}
                  className="flex-2 flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-lg shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === 'accept' ? 'SYNCING...' : 'ACCEPT ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}