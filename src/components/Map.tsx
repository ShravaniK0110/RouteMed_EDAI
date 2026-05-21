'use client'

import { useEffect, useRef } from 'react'

interface MapProps {
  patientLat: number
  patientLng: number
  paramedicLat?: number
  paramedicLng?: number

  hospitalLat?: number
  hospitalLng?: number

  showRoute?: boolean
  showHospital?: boolean

  onRouteInfo?: (info: {
    distanceKm: number
    etaMinutes: number
  }) => void
}

export default function Map({
  patientLat,
  patientLng,
  paramedicLat = 0,
  paramedicLng = 0,
  hospitalLat,
  hospitalLng,
  showRoute = false,
  showHospital = false,
  onRouteInfo,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)

  const map = useRef<any>(null)
  const patientMarker = useRef<any>(null)
  const paramedicMarker = useRef<any>(null)
  const hospitalMarker = useRef<any>(null)
  const routeControl = useRef<any>(null)

  const lastRouteKey = useRef<string>('')

  const isValidCoord = (lat?: number, lng?: number) => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      lat !== 0 &&
      lng !== 0
    )
  }

  const loadCss = (id: string, href: string) => {
    if (document.getElementById(id)) return

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  const loadScript = (id: string, src: string) => {
    return new Promise<void>((resolve) => {
      const existing = document.getElementById(id)

      if (existing) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.id = id
      script.src = src
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => resolve()
      document.body.appendChild(script)
    })
  }

  const createIcons = (L: any) => {
    const patientIcon = L.divIcon({
      html: `
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: white;
          border: 3px solid #b86b52;
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">📍</div>
      `,
      className: '',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    })

    const ambulanceIcon = L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: white;
          border: 3px solid #dc2626;
          box-shadow: 0 10px 24px rgba(0,0,0,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        ">🚑</div>
      `,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    const hospitalIcon = L.divIcon({
      html: `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: white;
          border: 3px solid #2563eb;
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        ">🏥</div>
      `,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    return {
      patientIcon,
      ambulanceIcon,
      hospitalIcon,
    }
  }

  const removeRoute = () => {
    if (routeControl.current && map.current) {
      try {
        map.current.removeControl(routeControl.current)
      } catch {}
    }

    routeControl.current = null
    lastRouteKey.current = ''
  }

  const getDestination = () => {
    if (
      showHospital &&
      isValidCoord(hospitalLat, hospitalLng)
    ) {
      return {
        lat: hospitalLat as number,
        lng: hospitalLng as number,
        label: 'Hospital',
      }
    }

    return {
      lat: patientLat,
      lng: patientLng,
      label: 'Patient',
    }
  }

  const updateRoute = () => {
    const L = (window as any).L

    if (!L || !map.current) return

    const destination = getDestination()

    const canRoute =
      showRoute &&
      isValidCoord(paramedicLat, paramedicLng) &&
      isValidCoord(destination.lat, destination.lng)

    if (!canRoute) {
      removeRoute()
      return
    }

    const routeKey = [
      paramedicLat.toFixed(5),
      paramedicLng.toFixed(5),
      destination.lat.toFixed(5),
      destination.lng.toFixed(5),
    ].join('|')

    if (routeKey === lastRouteKey.current) return

    lastRouteKey.current = routeKey

    removeRoute()

    if (!(L as any).Routing) return

    routeControl.current = (L as any).Routing.control({
      waypoints: [
        L.latLng(paramedicLat, paramedicLng),
        L.latLng(destination.lat, destination.lng),
      ],

      router: (L as any).Routing.osrmv1({
        serviceUrl:
          'https://router.project-osrm.org/route/v1',
      }),

      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null,

      lineOptions: {
        styles: [
          {
            color: '#b86b52',
            opacity: 0.9,
            weight: 6,
          },
        ],
      },
    }).addTo(map.current)

    routeControl.current.on(
      'routesfound',
      (event: any) => {
        const route = event.routes?.[0]

        if (!route) return

        const distanceKm =
          route.summary.totalDistance / 1000

        const etaMinutes =
          route.summary.totalTime / 60

        onRouteInfo?.({
          distanceKm:
            Number(distanceKm.toFixed(2)),
          etaMinutes:
            Math.ceil(etaMinutes),
        })
      }
    )
  }

  const fitMap = () => {
    const L = (window as any).L

    if (!L || !map.current) return

    const layers = [
      patientMarker.current,
      paramedicMarker.current,
      hospitalMarker.current,
    ].filter(Boolean)

    if (layers.length > 1) {
      const group = L.featureGroup(layers)
      map.current.fitBounds(
        group.getBounds().pad(0.25)
      )
    }
  }

  useEffect(() => {
    if (!mapContainer.current) return

    loadCss(
      'leaflet-css',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    )

    loadCss(
      'leaflet-routing-css',
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.css'
    )

    if (!document.getElementById('leaflet-cleanup-css')) {
      const style = document.createElement('style')
      style.id = 'leaflet-cleanup-css'
      style.innerHTML = `
        .leaflet-routing-container {
          display: none !important;
        }

        .leaflet-control-attribution {
          font-size: 10px !important;
        }
      `
      document.head.appendChild(style)
    }

    const initMap = async () => {
      await loadScript(
        'leaflet-js',
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      )

      await loadScript(
        'leaflet-routing-js',
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js'
      )

      const L = (window as any).L

      if (!L || !mapContainer.current) return

      if ((mapContainer.current as any)._leaflet_id) {
        ;(mapContainer.current as any)._leaflet_id = null
      }

      if (map.current) {
        map.current.remove()
        map.current = null
      }

      map.current = L.map(mapContainer.current).setView(
        [patientLat, patientLng],
        14
      )

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '© OpenStreetMap contributors',
        }
      ).addTo(map.current)

      const {
        patientIcon,
        ambulanceIcon,
        hospitalIcon,
      } = createIcons(L)

      if (isValidCoord(patientLat, patientLng)) {
        patientMarker.current = L.marker(
          [patientLat, patientLng],
          { icon: patientIcon }
        )
          .bindPopup('<b>Patient Location</b>')
          .addTo(map.current)
      }

      if (
        isValidCoord(paramedicLat, paramedicLng)
      ) {
        paramedicMarker.current = L.marker(
          [paramedicLat, paramedicLng],
          { icon: ambulanceIcon }
        )
          .bindPopup('<b>Ambulance</b>')
          .addTo(map.current)
      }

      if (
        showHospital &&
        isValidCoord(hospitalLat, hospitalLng)
      ) {
        hospitalMarker.current = L.marker(
          [hospitalLat, hospitalLng],
          { icon: hospitalIcon }
        )
          .bindPopup('<b>Hospital</b>')
          .addTo(map.current)
      }

      updateRoute()
      fitMap()
    }

    initMap()

    return () => {
      removeRoute()

      try {
        if (map.current) {
          map.current.remove()
        }
      } catch {}

      map.current = null
      patientMarker.current = null
      paramedicMarker.current = null
      hospitalMarker.current = null
    }
  }, [])

  useEffect(() => {
    const L = (window as any).L

    if (!L || !map.current) return

    const {
      patientIcon,
      ambulanceIcon,
      hospitalIcon,
    } = createIcons(L)

    if (isValidCoord(patientLat, patientLng)) {
      if (patientMarker.current) {
        patientMarker.current.setLatLng([
          patientLat,
          patientLng,
        ])
      } else {
        patientMarker.current = L.marker(
          [patientLat, patientLng],
          { icon: patientIcon }
        ).addTo(map.current)
      }
    }

    if (
      isValidCoord(paramedicLat, paramedicLng)
    ) {
      if (paramedicMarker.current) {
        paramedicMarker.current.setLatLng([
          paramedicLat,
          paramedicLng,
        ])
      } else {
        paramedicMarker.current = L.marker(
          [paramedicLat, paramedicLng],
          { icon: ambulanceIcon }
        ).addTo(map.current)
      }
    } else if (paramedicMarker.current) {
      map.current.removeLayer(
        paramedicMarker.current
      )
      paramedicMarker.current = null
    }

    if (
      showHospital &&
      isValidCoord(hospitalLat, hospitalLng)
    ) {
      if (hospitalMarker.current) {
        hospitalMarker.current.setLatLng([
          hospitalLat,
          hospitalLng,
        ])
      } else {
        hospitalMarker.current = L.marker(
          [hospitalLat, hospitalLng],
          { icon: hospitalIcon }
        ).addTo(map.current)
      }
    } else if (hospitalMarker.current) {
      map.current.removeLayer(
        hospitalMarker.current
      )
      hospitalMarker.current = null
    }

    updateRoute()
    fitMap()
  }, [
    patientLat,
    patientLng,
    paramedicLat,
    paramedicLng,
    hospitalLat,
    hospitalLng,
    showRoute,
    showHospital,
  ])

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-lg relative z-0"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
      }}
    />
  )
}