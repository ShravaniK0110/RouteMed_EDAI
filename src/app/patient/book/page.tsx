'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  MapPin,
  AlertTriangle,
  ChevronRight,
  Crosshair,
  Search,
  Activity
} from 'lucide-react';

export default function PatientBook() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [addressInput, setAddressInput] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [addressName, setAddressName] = useState('Locating...');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [emergencyType, setEmergencyType] = useState('Medical Emergency');
  const [severity, setSeverity] = useState('High');
  const [locationError, setLocationError] = useState('');

  const fetchRealLocation = () => {
    if (navigator.geolocation) {
      setLocationError('Fetching GPS...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);

          setAddressName(
            `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          );

          setLocationError('');
        },
        (error) => {
          console.warn('GPS Error:', error.message);

          setLatitude(18.5204);
          setLongitude(73.8567);

          setLocationError(
            'GPS Blocked by Browser. Defaulting to Pune Center.'
          );

          setAddressName(
            'Default Location (Enable Location in Browser)'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };

  useEffect(() => {
    fetchRealLocation();
  }, []);

  useEffect(() => {
    if (!isSearching || !activeRideId) return;

    const channel = supabase
      .channel(`patient_wait_${activeRideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${activeRideId}`
        },
        (payload) => {
          if (payload.new.status === 'accepted') {
            router.push(`/patient/tracking/${activeRideId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSearching, activeRideId, router]);

  const handleAddressInput = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setAddressInput(value);

    if (value.length < 3) {
      return setSuggestions([]);
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value + ' Pune'
        )}&format=json&limit=5&countrycodes=in`
      );

      const results = await res.json();

      setSuggestions(
        results.map((r: any) => ({
          label: r.display_name
            .split(',')
            .slice(0, 3)
            .join(','),

          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
      );
    } catch {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setAddressName(suggestion.label);
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lng);
    setAddressInput(suggestion.label);
    setSuggestions([]);
    setUseCurrentLocation(false);
  };

  const handleRequest = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (loading) return;

    if (
      latitude === null ||
      longitude === null
    ) {
      return alert('Location required.');
    }

    setLoading(true);

    try {
      const userStr =
        localStorage.getItem('user');

      const token =
        localStorage.getItem('token');

      if (!userStr || !token) {
        alert(
          'Please login before requesting ambulance.'
        );

        router.push('/login');

        setLoading(false);

        return;
      }

      const user = JSON.parse(userStr);

      if (!user?.id) {
        alert('Invalid user session.');

        localStorage.removeItem('user');
        localStorage.removeItem('token');

        router.push('/login');

        setLoading(false);

        return;
      }

      if (user.role !== 'patient') {
        alert(
          'Only patient accounts can request ambulances.'
        );

        setLoading(false);

        return;
      }

      const mlResponse = await fetch(
        '/api/booking/ml-analysis',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            latitude,
            longitude,
            emergencyType,
            severity,
          }),
        }
      );

      const mlData = await mlResponse.json();

      const bestHospitalId =
        mlData.selectedHospital?.id ||
        mlData.allTopHospitals?.[0]?.id;

      if (!bestHospitalId) {
        throw new Error(
          'No hospital available nearby'
        );
      }

      const bookingResponse =
        await fetch(
          '/api/booking/create',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              patientId: user.id,
              pickupLat: latitude,
              pickupLng: longitude,
              hospitalId: bestHospitalId,
              severity,
            }),
          }
        );

      const bookingData =
        await bookingResponse.json();

      if (!bookingResponse.ok || !bookingData.success) {
        throw new Error(
          bookingData.error ||
            'Ride creation failed'
        );
      }

      setActiveRideId(
        bookingData.rideId
      );

      setIsSearching(true);

      const smartMatchResponse =
        await fetch(
          '/api/booking/smart-match',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              request_id:
                bookingData.rideId,
            }),
          }
        );

      const smartMatchData =
        await smartMatchResponse.json();

      if (!smartMatchResponse.ok || !smartMatchData.success) {
        throw new Error(
          smartMatchData.error ||
            'Smart matching failed'
        );
      }

    } catch (error: any) {
      console.error(
        '[PATIENT BOOKING ERROR]',
        error
      );

      alert(
        `Dispatch Error: ${
          error.message ||
          'Unknown error'
        }`
      );

      setIsSearching(false);
    } finally {
      setLoading(false);
    }
  };

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-50 space-y-8 px-4">
        <div className="relative flex items-center justify-center mt-[-10vh]">
          <div className="absolute w-64 h-64 border-4 border-blue-500 rounded-full animate-ping opacity-20 duration-1000"></div>

          <div className="absolute w-48 h-48 border-4 border-blue-500 rounded-full animate-ping opacity-40 duration-700"></div>

          <div className="absolute w-32 h-32 bg-blue-200 rounded-full animate-pulse opacity-60"></div>

          <div className="z-10 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
            <Activity className="h-10 w-10 text-white animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-3 z-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Locating Ambulance
          </h2>

          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            Our ML engine is analyzing traffic,
            distance, and vehicle equipment to
            match you with the best response team
            for a
            <strong className="text-red-500 uppercase">
              {' '}
              {severity}{' '}
            </strong>
            condition.
          </p>
        </div>

        <div className="w-full max-w-xs bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
            <Search className="h-5 w-5 text-slate-400 animate-spin-slow" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Status
            </p>

            <p className="text-sm font-bold text-slate-700">
              Broadcasting Signal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 px-4">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-900">
          Request Ambulance
        </h1>

        <p className="text-slate-500 text-sm">
          Real-time GPS dispatching for Pune Emergency Services.
        </p>
      </div>

      <form
        onSubmit={handleRequest}
        className="space-y-6"
      >
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" />

              Emergency Information
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Emergency Type
              </label>

              <select
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(
                    e.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-black outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option>
                  Medical Emergency
                </option>

                <option>
                  Accident / Injury
                </option>

                <option>
                  Pregnancy
                </option>

                <option>
                  Cardiac Arrest
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Severity
              </label>

              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(
                    e.target.value
                  )
                }
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>

                <option value="Medium">
                  Medium
                </option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-blue-500" />

              Pickup Location
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setUseCurrentLocation(
                    true
                  );

                  fetchRealLocation();
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                  useCurrentLocation
                    ? 'bg-white shadow-sm text-blue-600 border border-slate-200'
                    : 'text-slate-500'
                }`}
              >
                <Crosshair className="h-3 w-3" />

                GPS
              </button>

              <button
                type="button"
                onClick={() =>
                  setUseCurrentLocation(
                    false
                  )
                }
                className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                  !useCurrentLocation
                    ? 'bg-white shadow-sm text-blue-600 border border-slate-200'
                    : 'text-slate-500'
                }`}
              >
                <Search className="h-3 w-3" />

                Search
              </button>
            </div>

            {!useCurrentLocation && (
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm pl-10 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search in Pune..."
                  value={addressInput}
                  onChange={
                    handleAddressInput
                  }
                />

                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    {suggestions.map(
                      (s, i) => (
                        <div
                          key={i}
                          onClick={() =>
                            handleSelectSuggestion(
                              s
                            )
                          }
                          className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-medium border-b border-slate-100 last:border-0"
                        >
                          {s.label}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            <div
              className={`p-3 rounded-lg border flex items-center gap-3 ${
                locationError
                  ? 'bg-amber-50 border-amber-100'
                  : 'bg-green-50 border-green-100'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  locationError
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
              />

              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                Location: {addressName}
              </p>
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
        >
          {loading
            ? 'Optimizing Hospital Match...'
            : 'Confirm Request'}

          {!loading && (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}