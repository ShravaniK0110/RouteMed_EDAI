'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Clock, AlertTriangle } from 'lucide-react'

const Map = dynamic<any>(() => import('@/components/Map'), { ssr: false })

export default function PatientHome() {
  const [userName] = useState('')

  const [patientLocation, setPatientLocation] = useState({
    lat: 18.5204,
    lng: 73.8567,
  })

  const [locationName, setLocationName] = useState('Locating…')

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName('Pune')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        setPatientLocation({
          lat: latitude,
          lng: longitude,
        })

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )

          const data = await res.json()

          const shortAddress =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.road ||
            'Pune Area'

          setLocationName(
            `${shortAddress}, ${data.address?.city || 'Pune'}`
          )
        } catch {
          setLocationName(
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          )
        }
      },
      () => {
        setLocationName('Pune (enable GPS for precision)')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-dark/50 mb-0.5">
            Patient Dashboard
          </p>

          <h1 className="text-2xl font-bold text-ink">
            Hello{userName?.trim() ? `, ${userName}` : ''}
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-paper border border-primary/20 rounded-lg px-3 py-2">
          <span className="text-xs text-dark/60 font-mono">
            Wallet
          </span>

          <span className="text-sm font-bold text-ink font-mono">
            ₹0.00
          </span>
        </div>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden border border-primary/20 shadow-warm min-h-[300px]">
  <Map
  patientLat={patientLocation.lat}
  patientLng={patientLocation.lng}
/>

  <div className="absolute top-3 left-3 z-10 bg-paper/95 border border-primary/20 rounded-lg px-3 py-2 shadow-warm flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />

    <span className="text-xs font-mono text-ink/80 truncate max-w-[200px]">
      {locationName}
    </span>
  </div>
</div>

      <div className="grid grid-cols-3 gap-3 shrink-0">
        <Link
          href="/patient/book"
          className="col-span-3 md:col-span-1 bg-accent hover:bg-red-700 text-white rounded-xl p-5 flex items-center gap-4 transition-colors shadow-warm"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>

          <div>
            <h3 className="font-bold text-base leading-tight">
              EMERGENCY SOS
            </h3>

            <p className="text-red-200 text-xs mt-0.5">
              Request critical response
            </p>
          </div>
        </Link>

        <Link
          href="/patient/book"
          className="col-span-3 md:col-span-1 bg-paper border border-primary/20 hover:border-primary hover:bg-white rounded-xl p-5 flex items-center gap-4 transition-all"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h3 className="font-bold text-base text-ink">
              Book Now
            </h3>

            <p className="text-dark text-xs mt-0.5">
              Medical transfer
            </p>
          </div>
        </Link>

        <button className="col-span-3 md:col-span-1 bg-paper border border-primary/20 rounded-xl p-5 flex items-center gap-4 opacity-50 cursor-not-allowed">
          <div className="w-10 h-10 bg-dark/10 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-dark" />
          </div>

          <div className="text-left">
            <h3 className="font-bold text-base text-ink">
              Schedule
            </h3>

            <p className="text-dark text-xs mt-0.5">
              Coming soon
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}