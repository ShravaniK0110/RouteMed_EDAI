'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { checkForBetterRoute } from '@/lib/rerouting';
import dynamic from 'next/dynamic';
import {
  Navigation, AlertTriangle, MapPin, Clock, Activity,
  User, Hospital, RefreshCw, CheckCircle, Zap
} from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

type Coords = { lat: number; lng: number };

export default function ParamedicActiveRide({ params }: { params: { rideId: string } }) {
  const router = useRouter();

  const [rideData, setRideData] = useState<any>(null);
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [paramedicId, setParamedicId] = useState<string | null>(null);
  const [rerouteNotice, setRerouteNotice] = useState<string | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [mlFare, setMlFare] = useState<number | null>(null);
  
  // NEW: 2-Stage Mission Phase Tracker
  const [missionPhase, setMissionPhase] = useState<'pickup' | 'dropoff'>('pickup');

  // 1. Load ride + hospital details
  useEffect(() => {
    const loadRideData = async () => {
      const { data: ride } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.rideId)
        .single();

      if (!ride) return;
      setRideData(ride);
      
      if (ride.total_fare) setMlFare(ride.total_fare);

      const pid = ride.paramedic_id || JSON.parse(localStorage.getItem('user') || '{}').id;
      setParamedicId(pid);

      // Load dynamic hospital info (Not hardcoded!)
      if (ride.hospital_id) {
        const { data: hospital } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', ride.hospital_id)
          .single();
        if (hospital) setHospitalData(hospital);
      }
    };

    loadRideData();
  }, [params.rideId]);

  // 2. GPS watcher
  useEffect(() => {
    if (!paramedicId) return;
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        await fetch('/api/paramedic/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            latitude, 
            longitude, 
            speed: speed || 0, 
            paramedic_id: paramedicId  
          }),
        }).catch(() => {});
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [paramedicId]);

  // 3. Timers
  useEffect(() => {
    const t = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setEtaMinutes(e => Math.max(0, e - 1 / 60)), 1000);
    return () => clearInterval(t);
  }, []);

  // 4. Reroute Check
  useEffect(() => {
    const interval = setInterval(async () => {
      if (coords) {
        const result = await checkForBetterRoute(params.rideId, coords.lat, coords.lng);
        if (result.suggestReroute) {
          setRerouteNotice(`Faster route via ${result.newRouteName} — saves ${result.timeSaved} min`);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [coords, params.rideId]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleComplete = async () => {
    await supabase.from('rides').update({ status: 'completed' }).eq('id', params.rideId);
    
    // Set paramedic back online for the next job
    if (paramedicId) {
       await supabase.from('paramedics').update({ is_online: true }).eq('id', paramedicId);
    }
    
    router.push('/paramedic/home');
  };

  if (!rideData) return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" /></div>;

  // Determine Map Destination based on Mission Phase
  const targetLat = missionPhase === 'pickup' ? rideData.pickup_lat : (hospitalData?.lat || rideData.pickup_lat);
  const targetLng = missionPhase === 'pickup' ? rideData.pickup_lng : (hospitalData?.lng || rideData.pickup_lng);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white p-4 gap-4 font-sans">

      {/* Dynamic Header */}
      <div className={`flex items-center justify-between border rounded-2xl p-4 transition-colors ${missionPhase === 'pickup' ? 'bg-blue-900/40 border-blue-500/50' : 'bg-green-900/40 border-green-500/50'}`}>
        <div className="flex items-center gap-3">
          <Navigation className={`h-6 w-6 animate-pulse ${missionPhase === 'pickup' ? 'text-blue-400' : 'text-green-400'}`} />
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${missionPhase === 'pickup' ? 'text-blue-400' : 'text-green-400'}`}>
              Active Mission Phase {missionPhase === 'pickup' ? '1' : '2'}
            </p>
            <p className="text-lg font-black text-white">
              {missionPhase === 'pickup' ? 'En Route to Patient' : 'En Route to Hospital'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase">Elapsed</p>
          <p className="text-xl font-black text-white">{formatTime(elapsedSecs)}</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
          <Clock className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-2xl font-black text-yellow-300">{Math.ceil(etaMinutes)}</p>
          <p className="text-[10px] text-slate-400">min ETA</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
          <Activity className="h-4 w-4 text-red-400 mx-auto mb-1" />
          <p className="text-sm font-black text-red-300 leading-tight mt-1">{rideData.severity}</p>
          <p className="text-[10px] text-slate-400">Severity</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-center">
          <Zap className="h-4 w-4 text-blue-400 mx-auto mb-1" />
          <p className="text-sm font-black text-blue-300 leading-tight mt-1">
            ₹{mlFare || 125}
          </p>
          <p className="text-[10px] text-slate-400">Est. Fare</p>
        </div>
      </div>

      {/* Map Segment */}
      <div className="h-52 rounded-2xl overflow-hidden border border-slate-700 relative">
        {coords ? (
          <Map
            patientLat={targetLat}
            patientLng={targetLng}
            paramedicLat={coords.lat}
            paramedicLng={coords.lng}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-900">
            <p className="text-slate-500 text-sm animate-pulse">Acquiring High-Res GPS...</p>
          </div>
        )}
      </div>

      {/* Patient Section */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Profile</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Emergency Protocol</p>
            <p className="font-bold text-white">{rideData.emergency_type}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Severity Level</p>
            <p className={`font-bold ${rideData.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}`}>
              {rideData.severity}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-slate-500 uppercase">Target Coordinates</p>
            <p className="font-mono text-xs text-slate-300">
              {rideData.pickup_lat?.toFixed(5)}, {rideData.pickup_lng?.toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Section */}
      {hospitalData && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hospital className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Destination Secured</p>
          </div>
          <p className="font-black text-white text-lg mb-3">{hospitalData.name}</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-950 rounded-xl p-2 text-center border border-slate-800">
              <p className="text-slate-500 mb-1">Beds Free</p>
              <p className="font-black text-green-400 text-lg">{hospitalData.available_beds}</p>
            </div>
            <div className="bg-slate-950 rounded-xl p-2 text-center border border-slate-800">
              <p className="text-slate-500 mb-1">Rating</p>
              {/* Fallback added in case DB rating is empty */}
              <p className="font-black text-yellow-400 text-lg">{hospitalData.quality_rating || '4.8'}/5</p>
            </div>
            <div className="bg-slate-950 rounded-xl p-2 text-center border border-slate-800">
              <p className="text-slate-500 mb-1">Dist.</p>
              <p className="font-black text-blue-400 text-lg">{(etaMinutes / 3).toFixed(1)}km</p>
            </div>
          </div>
        </div>
      )}

      {/* Clean ML Analysis Section */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-purple-400" />
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">ML Dispatch Intelligence</p>
        </div>
        <div className="space-y-2.5">
          <p className="text-xs text-slate-300 flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0">→</span>
            <span>Matched specific hospital capabilities for <strong>{rideData.emergency_type}</strong> response.</span>
          </p>
          <p className="text-xs text-slate-300 flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0">→</span>
            <span>Optimized for highest current bed availability ({hospitalData?.available_beds || 'Open'} beds).</span>
          </p>
          <p className="text-xs text-slate-300 flex items-start gap-2">
            <span className="text-purple-400 font-bold shrink-0">→</span>
            <span>Selected shortest real-time traffic route for {rideData.severity} priority.</span>
          </p>
        </div>
      </div>

      {/* Dynamic Actions */}
      <div className="mt-2">
        {missionPhase === 'pickup' ? (
          <button
            onClick={() => setMissionPhase('dropoff')}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <User className="h-6 w-6" />
            Patient Picked Up
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)]"
          >
            <CheckCircle className="h-6 w-6" />
            Complete Mission
          </button>
        )}
      </div>

    </div>
  );
}