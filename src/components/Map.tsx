'use client'

import { useEffect, useRef } from 'react'

interface MapProps {
  patientLat: number;
  patientLng: number;
  paramedicLat: number;
  paramedicLng: number;
}

export default function Map({ patientLat, patientLng, paramedicLat, paramedicLng }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const patientMarker = useRef<any>(null)
  const paramedicMarker = useRef<any>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // 1. Prevent duplicate script injections
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)
    }

    const initMap = () => {
      const L = (window as any).L
      if (!L || !mapContainer.current) return

      // 2. THE BUG KILLER: Force clear the lingering Leaflet ID from the DOM element
      if ((mapContainer.current as any)._leaflet_id) {
        (mapContainer.current as any)._leaflet_id = null;
      }

      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      // Initialize map centered at Patient location
      map.current = L.map(mapContainer.current).setView([patientLat, patientLng], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map.current)

      // Create initial markers
      patientMarker.current = L.marker([patientLat, patientLng])
        .bindPopup("<b>Patient Location</b>")
        .addTo(map.current)

      // Only add paramedic marker if we have real coordinates (not 0)
      if (paramedicLat !== 0 && paramedicLng !== 0) {
        paramedicMarker.current = L.marker([paramedicLat, paramedicLng])
          .bindPopup("<b>Ambulance</b>")
          .addTo(map.current)
      }
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      // Script is already in the document, just initialize
      if ((window as any).L) {
        initMap()
      } else {
        setTimeout(initMap, 500)
      }
    }

    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          // React Strict Mode double-unmount safety net
          console.warn("Leaflet map already removed");
        }
        map.current = null;
      }
    }
  }, []) // Only run once on mount

  // Effect updates marker positions when GPS changes WITHOUT reloading the map
  useEffect(() => {
    const L = (window as any).L
    if (!L || !map.current) return

    if (patientMarker.current) {
      patientMarker.current.setLatLng([patientLat, patientLng])
    }

    if (paramedicLat !== 0 && paramedicLng !== 0) {
      if (paramedicMarker.current) {
        paramedicMarker.current.setLatLng([paramedicLat, paramedicLng])
      } else {
        paramedicMarker.current = L.marker([paramedicLat, paramedicLng])
          .bindPopup("<b>Ambulance</b>")
          .addTo(map.current)
      }
      
      // Auto-adjust map view to show both markers
      if (patientMarker.current && paramedicMarker.current) {
        const group = L.featureGroup([patientMarker.current, paramedicMarker.current])
        map.current.fitBounds(group.getBounds().pad(0.1))
      }
    }
  }, [patientLat, patientLng, paramedicLat, paramedicLng])

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg relative z-0"
      style={{ minHeight: '100%', width: '100%' }}
    />
  )
}