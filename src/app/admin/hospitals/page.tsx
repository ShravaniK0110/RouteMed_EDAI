'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import {
  Building2,
  Search,
  Bed,
  Star,
  MapPin,
  RefreshCw,
  Activity,
  HeartPulse
} from 'lucide-react'

interface Hospital {
  id: string
  name: string
  latitude: number
  longitude: number
  total_beds: number
  available_beds: number
  quality_rating: number | null
  rating: number | null
  has_cardiologist: boolean | null
  is_active: boolean | null
  address: string | null
  specialty: string | null
}

export default function AdminHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [filtered, setFiltered] = useState<Hospital[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHospitals = async () => {
    setLoading(true)
    setError(null)

    const { data, error: dbError } = await supabase
      .from('hospitals')
      .select(`
        id,
        name,
        latitude,
        longitude,
        total_beds,
        available_beds,
        quality_rating,
        rating,
        has_cardiologist,
        is_active,
        address,
        specialty
      `)
      .order('name', { ascending: true })

    if (dbError) {
      setError(dbError.message)
      setHospitals([])
      setFiltered([])
    } else {
      setHospitals(data || [])
      setFiltered(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase().trim()

    if (!q) {
      setFiltered(hospitals)
      return
    }

    setFiltered(
      hospitals.filter((h) =>
        h.name.toLowerCase().includes(q) ||
        (h.address || '').toLowerCase().includes(q) ||
        (h.specialty || '').toLowerCase().includes(q)
      )
    )
  }, [search, hospitals])

  const totalBeds = hospitals.reduce(
    (sum, h) => sum + Number(h.available_beds || 0),
    0
  )

  const avgRating =
    hospitals.length > 0
      ? (
          hospitals.reduce(
            (sum, h) =>
              sum + Number(h.quality_rating || h.rating || 0),
            0
          ) / hospitals.length
        ).toFixed(1)
      : '0.0'

  const activeHospitals =
    hospitals.filter((h) => h.is_active !== false).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#b86b52]/70 mb-1">
            Admin
          </p>

          <h1 className="text-4xl font-black text-[#231815] flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#b86b52]" />
            Hospitals Network
          </h1>

          {!loading && (
            <p className="text-black/50 text-sm mt-2">
              {hospitals.length} hospitals · {activeHospitals} active · {totalBeds} beds available · {avgRating}/5 avg rating
            </p>
          )}
        </div>

        <button
          onClick={fetchHospitals}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 hover:border-[#b86b52]/30 transition-all w-fit"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />

          <span className="text-sm font-semibold">
            Refresh
          </span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-black/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-[#b86b52]/40"
          placeholder="Search hospitals by name, address, or specialty..."
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
          Failed to load hospitals: {error}
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#b86b52] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-black/40">
            No hospitals found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 text-left">
                  <th className="p-4 text-xs uppercase text-black/40">
                    Hospital
                  </th>
                  <th className="p-4 text-xs uppercase text-black/40">
                    Beds
                  </th>
                  <th className="p-4 text-xs uppercase text-black/40">
                    Rating
                  </th>
                  <th className="p-4 text-xs uppercase text-black/40">
                    Specialty
                  </th>
                  <th className="p-4 text-xs uppercase text-black/40">
                    Status
                  </th>
                  <th className="p-4 text-xs uppercase text-black/40">
                    Coordinates
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-black/5 hover:bg-[#faf7f3]"
                  >
                    <td className="p-4">
                      <p className="font-bold text-[#231815]">
                        {h.name}
                      </p>

                      <p className="text-xs text-black/45 mt-1 flex items-start gap-1 max-w-xs">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        {h.address || 'Address not available'}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-green-600" />

                        <div>
                          <p className="font-black text-green-700">
                            {h.available_beds}
                          </p>

                          <p className="text-xs text-black/40">
                            of {h.total_beds}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="flex items-center gap-1 font-bold text-yellow-600">
                        {Number(h.quality_rating || h.rating || 0).toFixed(1)}
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {h.specialty && (
                          <span className="px-3 py-1 rounded-full bg-[#b86b52]/10 text-[#b86b52] text-xs font-bold border border-[#b86b52]/20">
                            {h.specialty}
                          </span>
                        )}

                        {h.has_cardiologist && (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold border border-red-200 flex items-center gap-1">
                            <HeartPulse className="h-3 w-3" />
                            Cardio
                          </span>
                        )}

                        {!h.specialty && !h.has_cardiologist && (
                          <span className="text-xs text-black/40">
                            General
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          h.is_active !== false
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {h.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="p-4 text-xs font-mono text-black/50">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {Number(h.latitude).toFixed(4)}, {Number(h.longitude).toFixed(4)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}