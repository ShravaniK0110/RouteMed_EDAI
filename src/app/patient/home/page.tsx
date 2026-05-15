'use client';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Clock, AlertTriangle, Crosshair } from 'lucide-react'

// Dynamic import for Leaflet Map to prevent SSR errors
const Map = dynamic<any>(() => import('@/components/Map'), { ssr: false });

export default function PatientHome() {
  const [userName] = useState(" "); 
  const [patientLocation, setPatientLocation] = useState({ lat: 18.5204, lng: 73.8567 });
  const [locationName, setLocationName] = useState("Locating your position...");

  // 1. Fetch Real GPS on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setPatientLocation({ lat: latitude, lng: longitude });
          
          // Reverse Geocode to show the user their actual neighborhood
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const shortAddress = data.address?.suburb || data.address?.neighbourhood || data.address?.road || "Pune Area";
            setLocationName(`${shortAddress}, ${data.address?.city || 'Pune'}`);
          } catch (err) {
            setLocationName(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.warn("GPS Error:", error.message);
          setLocationName("Pune (Enable GPS for precision)");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello {userName}</h1>
          <p className="text-slate-400 text-sm">Ambulances available near your location</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-sm font-medium text-slate-300 shadow flex items-center gap-2">
            Wallet: <span className="text-green-400">₹0.00</span>
        </div>
      </div>

      {/* The Map Section */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 shadow-xl mb-6">
        <Map 
          patientLat={patientLocation.lat} 
          patientLng={patientLocation.lng} 
          // Show a mock ambulance near the user's real position
          paramedicLat={patientLocation.lat + 0.003} 
          paramedicLng={patientLocation.lng + 0.002} 
        />

        {/* Map Overlay UI */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Crosshair className="h-3 w-3" /> Current Location
          </p>
          <div className="flex items-center gap-2 text-sm text-white font-medium">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
            {locationName}
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed Routing to /patient/book */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <Link 
          href="/patient/book" 
          className="col-span-1 sm:col-span-3 lg:col-span-1 bg-red-600 hover:bg-red-700 text-white rounded-xl p-6 flex flex-col items-center justify-center transition-colors shadow-lg shadow-red-600/20 group"
        >
          <AlertTriangle className="h-10 w-10 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-xl font-bold">EMERGENCY SOS</h3>
          <p className="text-red-200 text-sm mt-1 text-center">Tap to request critical response</p>
        </Link>

        <Link 
          href="/patient/book" 
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center transition-colors group"
        >
          <MapPin className="h-10 w-10 mb-3 text-blue-500 group-hover:text-blue-400" />
          <h3 className="text-lg font-bold text-white">Book Now</h3>
          <p className="text-slate-400 text-sm mt-1 text-center">Medical transfer</p>
        </Link>

        <button className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center transition-colors opacity-70 cursor-not-allowed">
          <Clock className="h-10 w-10 mb-3 text-purple-500" />
          <h3 className="text-lg font-bold text-white">Schedule</h3>
          <p className="text-slate-400 text-sm mt-1 text-center">Coming soon</p>
        </button>
      </div>
    </div>
  )
}