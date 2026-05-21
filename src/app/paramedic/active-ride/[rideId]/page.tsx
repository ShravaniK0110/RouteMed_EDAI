'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { checkForBetterRoute } from '@/lib/rerouting';
import { getDistanceKm, calculateETA } from '@/lib/matching';
import dynamic from 'next/dynamic';

import {
  Navigation,
  Clock,
  Activity,
  User,
  Hospital,
  RefreshCw,
  CheckCircle,
  Zap,
  Ambulance,
} from 'lucide-react';

const Map = dynamic<any>(
  () => import('@/components/Map'),
  { ssr: false }
);

type Coords = {
  lat: number;
  lng: number;
};

type RouteInfo = {
  distanceKm: number;
  etaMinutes: number;
};

export default function ParamedicActiveRide({
  params,
}: {
  params: { rideId: string };
}) {
  const router = useRouter();

  const [rideData, setRideData] = useState<any>(null);
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [paramedicId, setParamedicId] = useState<string | null>(null);
  const [rerouteNotice, setRerouteNotice] = useState<string | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number>(15);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [mlFare, setMlFare] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const [vehicleType, setVehicleType] = useState('Basic Ambulance');
  const [vehicleRegistration, setVehicleRegistration] = useState('');

  const [missionPhase, setMissionPhase] =
    useState<'pickup' | 'dropoff'>('pickup');

  useEffect(() => {
    const loadRideData = async () => {
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.rideId)
        .single();

      if (rideError || !ride) {
        console.error('[ACTIVE RIDE] Ride fetch error:', rideError);
        return;
      }

      setRideData(ride);

      if (ride.total_fare) {
        setMlFare(ride.total_fare);
      }

      const storedUser = JSON.parse(
        localStorage.getItem('user') || '{}'
      );

      const pid =
        ride.paramedic_id ||
        storedUser.id ||
        storedUser.paramedic_id ||
        storedUser.user_id;

      setParamedicId(pid);

      if (ride.hospital_id) {
        const { data: hospital, error: hospitalError } = await supabase
          .from('hospitals')
          .select('*')
          .eq('id', ride.hospital_id)
          .single();

        if (hospitalError) {
          console.error('[ACTIVE RIDE] Hospital fetch error:', hospitalError);
          return;
        }

        if (hospital) {
          setHospitalData(hospital);
        }
      }
    };

    loadRideData();
  }, [params.rideId]);

  useEffect(() => {
    if (!paramedicId) return;

    const loadParamedicDetails = async () => {
      const { data, error } = await supabase
        .from('paramedics')
        .select('vehicle_type, vehicle_registration')
        .eq('id', paramedicId)
        .single();

      if (error) {
        console.error('[ACTIVE RIDE] Paramedic details error:', error.message);
        return;
      }

      if (data?.vehicle_type) {
        setVehicleType(data.vehicle_type);
      }

      if (data?.vehicle_registration) {
        setVehicleRegistration(data.vehicle_registration);
      }
    };

    loadParamedicDetails();
  }, [paramedicId]);

  useEffect(() => {
    if (!paramedicId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed } = position.coords;

        setCoords({
          lat: latitude,
          lng: longitude,
        });

        const token = localStorage.getItem('token');

        await fetch('/api/paramedic/update-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude,
            longitude,
            speed: speed || 0,
            paramedic_id: paramedicId,
          }),
        }).catch((err) => {
          console.error('Location Update Failed:', err);
        });
      },
      (err) => {
        console.error('GPS error:', err);
      },
      {
        enableHighAccuracy: true,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [paramedicId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSecs((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setRouteInfo(null);
  }, [missionPhase]);

  useEffect(() => {
    if (!coords || !rideData) return;

    const pickupLat = Number(rideData.pickup_lat);
    const pickupLng = Number(rideData.pickup_lng);

    const hospitalLat =
      hospitalData?.latitude !== undefined
        ? Number(hospitalData.latitude)
        : null;

    const hospitalLng =
      hospitalData?.longitude !== undefined
        ? Number(hospitalData.longitude)
        : null;

    const destinationLat =
      missionPhase === 'pickup'
        ? pickupLat
        : hospitalLat;

    const destinationLng =
      missionPhase === 'pickup'
        ? pickupLng
        : hospitalLng;

    if (!destinationLat || !destinationLng) return;

    const distanceKm = getDistanceKm(
      coords.lat,
      coords.lng,
      destinationLat,
      destinationLng
    );

    const fallbackEta = calculateETA(distanceKm);

    if (!routeInfo) {
      setEtaMinutes(fallbackEta);
    }
  }, [
    coords,
    rideData,
    hospitalData,
    missionPhase,
    routeInfo,
  ]);

  useEffect(() => {
    if (!coords) return;

    let rerouteCooldown = false;

    const interval = setInterval(async () => {
      try {
        const result = await checkForBetterRoute(
          params.rideId,
          coords.lat,
          coords.lng
        );

        if (
          result.suggestReroute &&
          !rerouteCooldown
        ) {
          rerouteCooldown = true;

          if (result.timeSaved) {
            setEtaMinutes((prev) =>
              Math.max(1, prev - result.timeSaved)
            );
          }

          setRerouteNotice(
            `AI Rerouting Suggested • ${result.newRouteName} • Saves ${result.timeSaved} mins`
          );

          console.log('[REROUTE TRIGGERED]', result);

          setTimeout(() => {
            setRerouteNotice(null);
          }, 8000);

          setTimeout(() => {
            rerouteCooldown = false;
          }, 30000);
        }
      } catch (err) {
        console.error('[REROUTE CHECK ERROR]', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [coords, params.rideId]);

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60)
      .toString()
      .padStart(2, '0')}`;
  };

  const handlePatientPickedUp = async () => {
  await supabase
    .from('rides')
    .update({
      status: 'picked_up',
    })
    .eq('id', params.rideId);

  setMissionPhase('dropoff');
  setRouteInfo(null);
};

  const handleComplete = async () => {
    await supabase
      .from('rides')
      .update({
        status: 'completed',
      })
      .eq('id', params.rideId);

    if (paramedicId) {
      await supabase
        .from('paramedics')
        .update({
          is_online: true,
        })
        .eq('id', paramedicId);
    }

    router.push('/paramedic/home');
  };

  if (!rideData) {
    return (
      <div className="h-screen bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  const pickupLat = Number(rideData.pickup_lat);
  const pickupLng = Number(rideData.pickup_lng);

  const hospitalLat =
    hospitalData?.latitude !== undefined
      ? Number(hospitalData.latitude)
      : null;

  const hospitalLng =
    hospitalData?.longitude !== undefined
      ? Number(hospitalData.longitude)
      : null;

  const targetLat =
    missionPhase === 'pickup'
      ? pickupLat
      : hospitalLat || pickupLat;

  const targetLng =
    missionPhase === 'pickup'
      ? pickupLng
      : hospitalLng || pickupLng;

  const displayDistance =
    routeInfo?.distanceKm ??
    (coords
      ? Number(
          getDistanceKm(
            coords.lat,
            coords.lng,
            targetLat,
            targetLng
          ).toFixed(1)
        )
      : 0);

  return (
    <div className="flex flex-col min-h-screen bg-secondary text-ink p-4 gap-4 font-sans">
      <div className="bg-paper border border-primary/20 rounded-2xl p-4 shadow-warm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                missionPhase === 'pickup'
                  ? 'bg-primary/10'
                  : 'bg-green-100'
              }`}
            >
              <Navigation
                className={`h-6 w-6 ${
                  missionPhase === 'pickup'
                    ? 'text-primary'
                    : 'text-green-700'
                }`}
              />
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-dark/50">
                Active Ride · Phase {missionPhase === 'pickup' ? '1' : '2'}
              </p>

              <p className="text-xl font-black text-ink">
                {missionPhase === 'pickup'
                  ? 'En Route to Patient'
                  : 'En Route to Hospital'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-dark/50 uppercase tracking-widest">
              Elapsed
            </p>

            <p className="text-xl font-black text-ink">
              {formatTime(elapsedSecs)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {vehicleType}
          </span>

          {vehicleRegistration && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white border border-primary/20 text-dark/70">
              {vehicleRegistration}
            </span>
          )}

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              missionPhase === 'pickup'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-green-100 text-green-700 border-green-200'
            }`}
          >
            {missionPhase === 'pickup'
              ? 'Pickup in progress'
              : 'Hospital transfer'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper border border-primary/20 rounded-2xl p-3 text-center shadow-warm">
          <Clock className="h-4 w-4 text-primary mx-auto mb-1" />

          <p className="text-2xl font-black text-ink">
            {Math.ceil(etaMinutes)}
          </p>

          <p className="text-[10px] text-dark/50">
            min ETA
          </p>
        </div>

        <div className="bg-paper border border-primary/20 rounded-2xl p-3 text-center shadow-warm">
          <Activity className="h-4 w-4 text-accent mx-auto mb-1" />

          <p className="text-sm font-black text-accent leading-tight mt-1">
            {rideData.severity || 'Unknown'}
          </p>

          <p className="text-[10px] text-dark/50">
            Severity
          </p>
        </div>

        <div className="bg-paper border border-primary/20 rounded-2xl p-3 text-center shadow-warm">
          <Zap className="h-4 w-4 text-primary mx-auto mb-1" />

          <p className="text-sm font-black text-primary leading-tight mt-1">
            ₹{mlFare || 125}
          </p>

          <p className="text-[10px] text-dark/50">
            Est. Fare
          </p>
        </div>
      </div>

      <div className="h-64 rounded-2xl overflow-hidden border border-primary/20 relative shadow-warm bg-paper">
        {coords ? (
          <Map
            patientLat={pickupLat}
            patientLng={pickupLng}
            paramedicLat={coords.lat}
            paramedicLng={coords.lng}
            hospitalLat={
              hospitalLat !== null
                ? hospitalLat
                : undefined
            }
            hospitalLng={
              hospitalLng !== null
                ? hospitalLng
                : undefined
            }
            showRoute={true}
            showHospital={missionPhase === 'dropoff'}
            onRouteInfo={(info: RouteInfo) => {
              setRouteInfo(info);
              setEtaMinutes(info.etaMinutes);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-paper">
            <p className="text-dark/50 text-sm animate-pulse">
              Acquiring GPS location...
            </p>
          </div>
        )}
      </div>

      <div className="bg-paper border border-primary/20 rounded-2xl p-4 shadow-warm">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-primary" />

          <p className="text-xs font-bold text-dark/50 uppercase tracking-widest">
            Patient Details
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] text-dark/45 uppercase">
              Emergency Type
            </p>

            <p className="font-bold text-ink">
              {rideData.emergency_type || 'Medical Emergency'}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-dark/45 uppercase">
              Severity Level
            </p>

            <p
              className={`font-bold ${
                rideData.severity === 'Critical'
                  ? 'text-accent'
                  : 'text-primary'
              }`}
            >
              {rideData.severity || 'Unknown'}
            </p>
          </div>

          <div className="col-span-2">
            <p className="text-[10px] text-dark/45 uppercase">
              Pickup Coordinates
            </p>

            <p className="font-mono text-xs text-dark/70">
              {pickupLat.toFixed(5)}, {pickupLng.toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {hospitalData && (
        <div className="bg-paper border border-primary/20 rounded-2xl p-4 shadow-warm">
          <div className="flex items-center gap-2 mb-3">
            <Hospital className="h-4 w-4 text-primary" />

            <p className="text-xs font-bold text-dark/50 uppercase tracking-widest">
              Destination Hospital
            </p>
          </div>

          <p className="font-black text-ink text-lg mb-3">
            {hospitalData.name}
          </p>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white rounded-xl p-2 text-center border border-primary/10">
              <p className="text-dark/45 mb-1">
                Beds Free
              </p>

              <p className="font-black text-green-700 text-lg">
                {hospitalData.available_beds}
              </p>
            </div>

            <div className="bg-white rounded-xl p-2 text-center border border-primary/10">
              <p className="text-dark/45 mb-1">
                Rating
              </p>

              <p className="font-black text-primary text-lg">
                {hospitalData.quality_rating ||
                  hospitalData.rating ||
                  '4.8'}
                /5
              </p>
            </div>

            <div className="bg-white rounded-xl p-2 text-center border border-primary/10">
              <p className="text-dark/45 mb-1">
                Dist.
              </p>

              <p className="font-black text-ink text-lg">
                {displayDistance.toFixed(1)}km
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-paper border border-primary/20 rounded-2xl p-4 shadow-warm">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />

          <p className="text-xs font-bold text-dark/50 uppercase tracking-widest">
            Dispatch Intelligence
          </p>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs text-dark flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">
              →
            </span>

            <span>
              Matched hospital capabilities for{' '}
              <strong>
                {rideData.emergency_type || 'Medical Emergency'}
              </strong>{' '}
              response.
            </span>
          </p>

          <p className="text-xs text-dark flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">
              →
            </span>

            <span>
              Optimized for current bed availability (
              {hospitalData?.available_beds || 'Open'} beds).
            </span>
          </p>

          <p className="text-xs text-dark flex items-start gap-2">
            <span className="text-primary font-bold shrink-0">
              →
            </span>

            <span>
              Selected road-aware route for{' '}
              {rideData.severity || 'emergency'} priority.
            </span>
          </p>
        </div>
      </div>

      {rerouteNotice && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">
                Route Optimization
              </p>

              <p className="text-sm text-ink font-semibold">
                {rerouteNotice}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2">
        {missionPhase === 'pickup' ? (
          <button
            onClick={handlePatientPickedUp}
            className="w-full py-5 bg-primary hover:bg-ink text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-warm"
          >
            <User className="h-6 w-6" />
            Patient Picked Up
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-full py-5 bg-green-700 hover:bg-green-800 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-warm"
          >
            <CheckCircle className="h-6 w-6" />
            Complete Ride
          </button>
        )}
      </div>
    </div>
  );
}