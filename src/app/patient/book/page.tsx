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

type AddressSuggestion = {
  label: string;
  lat: number;
  lng: number;
  source?: 'local' | 'osm';
};

const PUNE_LOCATION_SUGGESTIONS: AddressSuggestion[] = [
  {
    label: 'Shivajinagar, Pune',
    lat: 18.5308,
    lng: 73.8475,
    source: 'local',
  },
  {
    label: 'Kothrud, Pune',
    lat: 18.5074,
    lng: 73.8077,
    source: 'local',
  },
  {
    label: 'Hinjewadi, Pune',
    lat: 18.5913,
    lng: 73.7389,
    source: 'local',
  },
  {
    label: 'Baner, Pune',
    lat: 18.5590,
    lng: 73.7868,
    source: 'local',
  },
  {
    label: 'Wakad, Pune',
    lat: 18.5970,
    lng: 73.7649,
    source: 'local',
  },
  {
    label: 'Aundh, Pune',
    lat: 18.5593,
    lng: 73.8078,
    source: 'local',
  },
  {
    label: 'Viman Nagar, Pune',
    lat: 18.5679,
    lng: 73.9143,
    source: 'local',
  },
  {
    label: 'Koregaon Park, Pune',
    lat: 18.5362,
    lng: 73.8930,
    source: 'local',
  },
  {
    label: 'Hadapsar, Pune',
    lat: 18.5089,
    lng: 73.9259,
    source: 'local',
  },
  {
    label: 'Magarpatta, Pune',
    lat: 18.5167,
    lng: 73.9272,
    source: 'local',
  },
  {
    label: 'Swargate, Pune',
    lat: 18.5018,
    lng: 73.8636,
    source: 'local',
  },
  {
    label: 'Deccan Gymkhana, Pune',
    lat: 18.5167,
    lng: 73.8414,
    source: 'local',
  },
  {
    label: 'FC Road, Pune',
    lat: 18.5204,
    lng: 73.8411,
    source: 'local',
  },
  {
    label: 'JM Road, Pune',
    lat: 18.5226,
    lng: 73.8478,
    source: 'local',
  },
  {
    label: 'Camp, Pune',
    lat: 18.5122,
    lng: 73.8797,
    source: 'local',
  },
  {
    label: 'Pimpri Chinchwad, Pune',
    lat: 18.6298,
    lng: 73.7997,
    source: 'local',
  },
  {
    label: 'Sassoon Hospital, Pune',
    lat: 18.5289,
    lng: 73.8738,
    source: 'local',
  },
  {
    label: 'Ruby Hall Clinic, Pune',
    lat: 18.5321,
    lng: 73.8769,
    source: 'local',
  },
  {
    label: 'Jehangir Hospital, Pune',
    lat: 18.5292,
    lng: 73.8762,
    source: 'local',
  },
  {
    label: 'Noble Hospital, Hadapsar, Pune',
    lat: 18.5074,
    lng: 73.9270,
    source: 'local',
  },
];

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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [emergencyType, setEmergencyType] = useState('Medical Emergency');
  const [severity, setSeverity] = useState('High');
  const [locationError, setLocationError] = useState('');

  const getLocalSuggestions = (value: string) => {
    const query = value.toLowerCase().trim();

    if (!query) return [];

    return PUNE_LOCATION_SUGGESTIONS.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  };

  const mergeSuggestions = (
    localSuggestions: AddressSuggestion[],
    osmSuggestions: AddressSuggestion[]
  ) => {
    const seen = new Set<string>();

    return [...localSuggestions, ...osmSuggestions].filter((item) => {
      const key = `${item.label.toLowerCase()}-${item.lat.toFixed(4)}-${item.lng.toFixed(4)}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  };

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

    const localMatches = getLocalSuggestions(value);

    if (value.trim().length < 2) {
      setSuggestions(localMatches);
      return;
    }

    setSuggestions(localMatches);

    if (value.trim().length < 3) {
      return;
    }

    setIsAddressLoading(true);

    try {
      const searchQuery = `${value}, Pune, Maharashtra, India`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=8&countrycodes=in&addressdetails=1&bounded=0`
      );

      const results = await res.json();

      const osmSuggestions: AddressSuggestion[] = results.map((r: any) => ({
        label: r.display_name
          .split(',')
          .slice(0, 5)
          .join(','),

        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        source: 'osm',
      }));

      setSuggestions(
        mergeSuggestions(
          localMatches,
          osmSuggestions
        )
      );
    } catch {
      setSuggestions(localMatches);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#f5efe7] space-y-8 px-4">
        <div className="relative flex items-center justify-center mt-[-10vh]">
          <div className="absolute w-64 h-64 border-4 border-[#b86b52] rounded-full animate-ping opacity-20 duration-1000"></div>

          <div className="absolute w-48 h-48 border-4 border-[#b86b52] rounded-full animate-ping opacity-40 duration-700"></div>

          <div className="absolute w-32 h-32 bg-[#b86b52]/20 rounded-full animate-pulse opacity-70"></div>

          <div className="z-10 w-20 h-20 bg-[#b86b52] rounded-full flex items-center justify-center shadow-2xl shadow-black/20">
            <Activity className="h-10 w-10 text-white animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-3 z-10">
          <h2 className="text-3xl font-black text-[#231815] tracking-tight">
            Locating Ambulance
          </h2>

          <p className="text-[#4b3a32] font-medium max-w-sm mx-auto">
            Our ML engine is analyzing traffic,
            distance, and vehicle equipment to
            match you with the best response team
            for a
            <strong className="text-[#dc2626] uppercase">
              {' '}
              {severity}{' '}
            </strong>
            condition.
          </p>
        </div>

        <div className="w-full max-w-xs bg-white p-4 rounded-2xl shadow-xl border border-[#b86b52]/20 flex items-center gap-4">
          <div className="h-10 w-10 bg-[#b86b52]/10 rounded-full flex items-center justify-center shrink-0">
            <Search className="h-5 w-5 text-[#b86b52] animate-spin-slow" />
          </div>

          <div>
            <p className="text-xs font-bold text-[#4b3a32]/60 uppercase">
              Status
            </p>

            <p className="text-sm font-bold text-[#231815]">
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
        <p className="text-xs font-mono uppercase tracking-widest text-[#b86b52] mb-1">
          Patient Request
        </p>

        <h1 className="text-3xl font-black text-[#231815]">
          Request Ambulance
        </h1>

        <p className="text-[#4b3a32]/70 text-sm mt-1">
          Real-time GPS dispatching for Pune emergency response.
        </p>
      </div>

      <form
        onSubmit={handleRequest}
        className="space-y-6"
      >
        <Card className="shadow-xl border border-[#b86b52]/20 bg-white rounded-2xl overflow-visible">
          <CardHeader className="bg-[#faf7f3] border-b border-[#b86b52]/10 py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-[#231815]">
              <AlertTriangle className="h-4 w-4 text-[#dc2626]" />

              Emergency Information
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#4b3a32]/60 uppercase">
                Emergency Type
              </label>

              <select
                value={emergencyType}
                onChange={(e) =>
                  setEmergencyType(
                    e.target.value
                  )
                }
                className="w-full border border-[#b86b52]/20 rounded-lg p-2.5 text-sm text-[#231815] outline-none focus:border-[#b86b52] bg-white"
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
              <label className="text-[10px] font-bold text-[#4b3a32]/60 uppercase">
                Severity
              </label>

              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(
                    e.target.value
                  )
                }
                className="w-full border border-[#b86b52]/20 rounded-lg p-2.5 text-sm font-bold text-[#dc2626] outline-none focus:border-[#dc2626] bg-white"
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

        <Card className="shadow-xl border border-[#b86b52]/20 bg-white rounded-2xl overflow-visible">
          <CardHeader className="bg-[#faf7f3] border-b border-[#b86b52]/10 py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-[#231815]">
              <MapPin className="h-4 w-4 text-[#b86b52]" />

              Pickup Location
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4 overflow-visible">
            <div className="flex p-1 bg-[#faf7f3] rounded-lg border border-[#b86b52]/20">
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
                    ? 'bg-white shadow-sm text-[#b86b52] border border-[#b86b52]/20'
                    : 'text-[#4b3a32]/60'
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
                    ? 'bg-white shadow-sm text-[#b86b52] border border-[#b86b52]/20'
                    : 'text-[#4b3a32]/60'
                }`}
              >
                <Search className="h-3 w-3" />

                Search
              </button>
            </div>

            {!useCurrentLocation && (
              <div className="relative z-50">
                <input
                  type="text"
                  className="w-full border border-[#b86b52]/20 rounded-lg p-2.5 text-sm pl-10 text-[#231815] bg-white placeholder:text-[#4b3a32]/40 outline-none focus:border-[#b86b52]"
                  placeholder="Search area, hospital, road, landmark..."
                  value={addressInput}
                  onChange={
                    handleAddressInput
                  }
                />

                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-[#b86b52]" />

                {(suggestions.length > 0 || isAddressLoading) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#b86b52]/20 rounded-xl shadow-2xl z-[9999] overflow-hidden max-h-72 overflow-y-auto">
                    {suggestions.map(
                      (s, i) => (
                        <button
                          type="button"
                          key={`${s.label}-${i}`}
                          onClick={() =>
                            handleSelectSuggestion(
                              s
                            )
                          }
                          className="w-full text-left p-3 hover:bg-[#faf7f3] cursor-pointer text-xs font-semibold text-[#231815] border-b border-[#b86b52]/10 last:border-0 leading-relaxed"
                        >
                          <span className="block text-[#231815]">
                            {s.label}
                          </span>

                          <span className="block text-[10px] text-[#4b3a32]/50 mt-0.5">
                            {s.source === 'local'
                              ? 'Suggested Pune location'
                              : 'OpenStreetMap result'}
                          </span>
                        </button>
                      )
                    )}

                    {isAddressLoading && (
                      <div className="p-3 text-xs font-semibold text-[#4b3a32]/60">
                        Searching more places...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div
              className={`p-3 rounded-lg border flex items-center gap-3 ${
                locationError
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  locationError
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
              />

              <p className="text-[10px] font-bold text-[#4b3a32]/70 uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                Location: {addressName}
              </p>
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#b86b52] hover:bg-[#231815] text-white rounded-xl font-bold shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
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