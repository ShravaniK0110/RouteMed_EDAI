'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import {
  CheckCircle2,
  Clock,
  Navigation,
  Route
} from 'lucide-react';

const Map = dynamic<any>(
  () => import('@/components/Map'),
  { ssr: false }
);

type Location = {
  lat: number;
  lng: number;
};

type RouteInfo = {
  distanceKm: number;
  etaMinutes: number;
};

export default function PatientTrackingPage({
  params,
}: {
  params: { requestId: string };
}) {
  const router = useRouter();

  const [paramedicLoc, setParamedicLoc] =
    useState<Location>({
      lat: 0,
      lng: 0,
    });

  const [patientLoc, setPatientLoc] =
    useState<Location>({
      lat: 0,
      lng: 0,
    });

  const [paramedicId, setParamedicId] =
    useState<string | null>(null);

  const [rideCompleted, setRideCompleted] =
    useState(false);

  const [paramedicName, setParamedicName] =
    useState<string>('Your paramedic');

  const [routeInfo, setRouteInfo] =
    useState<RouteInfo | null>(null);

  const hasPatientLocation =
    patientLoc.lat !== 0 &&
    patientLoc.lng !== 0;

  const hasParamedicLocation =
    paramedicLoc.lat !== 0 &&
    paramedicLoc.lng !== 0;

  // 1. Fetch initial ride + paramedic data
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: ride, error: rideError } =
        await supabase
          .from('rides')
          .select(
            'pickup_lat, pickup_lng, paramedic_id, status'
          )
          .eq('id', params.requestId)
          .single();

      if (rideError || !ride) {
        console.error(
          '[PATIENT TRACKING] Ride fetch error:',
          rideError
        );

        return;
      }

      if (ride.status === 'completed') {
        router.push(
          `/patient/rating?rideId=${params.requestId}`
        );

        return;
      }

      setPatientLoc({
        lat: Number(ride.pickup_lat),
        lng: Number(ride.pickup_lng),
      });

      if (ride.paramedic_id) {
        setParamedicId(ride.paramedic_id);

        const {
          data: paramedic,
          error: paramedicError,
        } = await supabase
          .from('paramedics')
          .select(
            'current_lat, current_lng, full_name'
          )
          .eq('id', ride.paramedic_id)
          .single();

        if (paramedicError) {
          console.error(
            '[PATIENT TRACKING] Paramedic fetch error:',
            paramedicError
          );

          return;
        }

        if (paramedic) {
          if (paramedic.full_name) {
            setParamedicName(
              paramedic.full_name
            );
          }

          if (
            paramedic.current_lat &&
            paramedic.current_lng
          ) {
            setParamedicLoc({
              lat: Number(
                paramedic.current_lat
              ),
              lng: Number(
                paramedic.current_lng
              ),
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
      .channel(
        `patient_tracking_paramedic_${paramedicId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'paramedics',
          filter: `id=eq.${paramedicId}`,
        },
        (payload) => {
          if (
            payload.new?.current_lat &&
            payload.new?.current_lng
          ) {
            setParamedicLoc({
              lat: Number(
                payload.new.current_lat
              ),
              lng: Number(
                payload.new.current_lng
              ),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gpsChannel);
    };
  }, [paramedicId]);

  // 3. Listen for ride completion
  useEffect(() => {
    const rideChannel = supabase
      .channel(
        `patient_tracking_ride_${params.requestId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${params.requestId}`,
        },
        (payload) => {
          if (
            payload.new?.status ===
            'completed'
          ) {
            setRideCompleted(true);

            setTimeout(() => {
              router.push(
                `/patient/rating?rideId=${params.requestId}`
              );
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
    };
  }, [params.requestId, router]);

  if (rideCompleted) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#231815] gap-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-white">
          Ride Completed!
        </h2>

        <p className="text-white/50">
          Taking you to the rating screen...
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#b86b52]/70 mb-1">
            Patient Tracking
          </p>

          <h1 className="text-3xl font-black text-[#231815]">
            Ambulance En Route
          </h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#231815] bg-white border border-black/10 rounded-full px-4 py-2 shadow-sm w-fit">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

          {hasParamedicLocation
            ? `${paramedicName} is moving`
            : 'Waiting for ambulance GPS'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#b86b52]/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-[#b86b52]" />
          </div>

          <div>
            <p className="text-xs text-black/45">
              Estimated Arrival
            </p>

            <p className="text-xl font-black text-[#231815]">
              {routeInfo
                ? `${routeInfo.etaMinutes} min`
                : hasParamedicLocation
                  ? 'Calculating...'
                  : 'Waiting...'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Route className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <p className="text-xs text-black/45">
              Road Distance
            </p>

            <p className="text-xl font-black text-[#231815]">
              {routeInfo
                ? `${routeInfo.distanceKm} km`
                : hasParamedicLocation
                  ? 'Calculating...'
                  : 'Waiting...'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-black/10 shadow-xl relative min-h-[350px]">
        {hasPatientLocation ? (
          <Map
            patientLat={patientLoc.lat}
            patientLng={patientLoc.lng}
            paramedicLat={paramedicLoc.lat}
            paramedicLng={paramedicLoc.lng}
            showRoute={hasParamedicLocation}
            onRouteInfo={(info: RouteInfo) => {
  setRouteInfo(info);
}}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-[#faf7f3]">
            <Navigation className="h-8 w-8 text-[#b86b52] animate-pulse" />

            <p className="text-sm text-black/50">
              Loading tracking map...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}