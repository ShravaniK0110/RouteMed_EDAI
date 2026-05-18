'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Power, AlertTriangle, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/useNotification';

const Map = dynamic<any>(() => import('@/components/Map'), { ssr: false });

export default function ParamedicHome() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [paramedicId, setParamedicId] = useState<string | null>(null);
  const [currentPos, setCurrentPos] = useState({ lat: 18.5204, lng: 73.8567 });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const id = user.id || user.paramedic_id || user.user_id;
      setParamedicId(id);
    }
  }, []);

  useEffect(() => {
    let watchId: number;
    if (isOnline && paramedicId && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentPos({ lat: latitude, lng: longitude });

          // FIXED: Matches your DB columns 'lat' and 'lng'
          const { error } = await supabase
            .from('paramedics')
            .update({ 
              current_lat: latitude, 
              current_lng: longitude,
              is_online: true 
            })
            .eq('id', paramedicId);

          if (error) console.error("Database Sync Error:", error.message);
          else console.log("📡 GPS Latched to DB:", latitude, longitude);
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isOnline, paramedicId]);

  useEffect(() => {
    if (!isOnline || !paramedicId || incomingRide) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('paramedic_id', paramedicId)
        .eq('status', 'searching');

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
      await supabase.from('paramedics').update({ is_online: nextStatus }).eq('id', paramedicId);
    }
  };

  const notifications = useNotifications(paramedicId);

  const acceptRide = async () => {
    if (!incomingRide || !paramedicId) return;
    setLoading(true);
    
    try {
      // Fix 6: Call the dedicated API route to trigger ML pricing & fare calculation
      const res = await fetch('/api/paramedic/accept-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          request_id: incomingRide.id, 
          paramedic_id: paramedicId 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Accept mission failed');
      }
      
      // Fix 5: Mark paramedic offline (busy) to prevent double-dispatch
      const { error: statusError } = await supabase
        .from('paramedics')
        .update({ is_online: false })
        .eq('id', paramedicId);

      if (statusError) console.error("Status Sync Error:", statusError.message);
      
      // Navigate to the full active-ride mission control
      router.push(`/paramedic/active-ride/${incomingRide.id}`);
      
    } catch (err: any) {
      console.error("Critical Acceptance Error:", err.message);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
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
        <button onClick={toggleStatus} className={`px-8 py-3 rounded-xl font-black transition-all ${isOnline ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'bg-green-600'}`}>
          <Power className="inline mr-2" /> {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

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
              <p className="text-slate-400 font-bold mb-8 uppercase text-sm tracking-widest">
                {incomingRide.emergency_type}
              </p>
              <button onClick={acceptRide} disabled={loading} className="w-full py-5 bg-green-600 rounded-2xl font-black text-2xl shadow-xl active:scale-95">
                {loading ? 'SYNCING...' : 'ACCEPT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}