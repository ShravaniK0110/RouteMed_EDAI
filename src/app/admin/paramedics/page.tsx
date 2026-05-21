'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import {
  Truck,
  Search,
  Star,
  ShieldCheck,
  RefreshCw,
  Phone,
  MapPin
} from 'lucide-react'

interface Paramedic {
  id: string
  full_name: string | null
  phone_number: string | null
  vehicle_registration: string | null
  vehicle_type: string | null
  is_online: boolean | null
  is_verified: boolean | null
  rating: number | null
  current_lat: number | null
  current_lng: number | null
  created_at: string | null
}

export default function AdminParamedics() {
  const [paramedics, setParamedics] = useState<Paramedic[]>([])
  const [filtered, setFiltered] = useState<Paramedic[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParamedics = async () => {
    setLoading(true)
    setError(null)

    const { data, error: dbError } = await supabase
      .from('paramedics')
      .select(`
        id,
        full_name,
        phone_number,
        vehicle_registration,
        vehicle_type,
        is_online,
        is_verified,
        rating,
        current_lat,
        current_lng,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (dbError) {
      setError(dbError.message)
      setParamedics([])
      setFiltered([])
    } else {
      setParamedics(data || [])
      setFiltered(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchParamedics()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase().trim()

    if (!q) {
      setFiltered(paramedics)
      return
    }

    setFiltered(
      paramedics.filter((p) =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.vehicle_registration || '').toLowerCase().includes(q) ||
        (p.vehicle_type || '').toLowerCase().includes(q) ||
        (p.phone_number || '').includes(q)
      )
    )
  }, [search, paramedics])

  const onlineCount = paramedics.filter((p) => p.is_online).length
  const verifiedCount = paramedics.filter((p) => p.is_verified).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#b86b52]/70 mb-1">
            Admin
          </p>

          <h1 className="text-4xl font-black text-[#231815] flex items-center gap-3">
            <Truck className="h-8 w-8 text-[#b86b52]" />
            Paramedics & Fleet
          </h1>

          {!loading && (
            <p className="text-black/50 text-sm mt-2">
              {paramedics.length} registered · {onlineCount} online · {verifiedCount} verified
            </p>
          )}
        </div>

        <button
          onClick={fetchParamedics}
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
          placeholder="Search by name, vehicle, or phone..."
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
          Failed to load paramedics: {error}
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#b86b52] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-black/40">
            {search
              ? `No paramedics matching "${search}"`
              : 'No paramedics registered yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 text-left">
                  <th className="p-4 text-xs uppercase text-black/40">
                    Paramedic
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Phone
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Vehicle
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Status
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Rating
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    GPS
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 hover:bg-[#faf7f3] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b86b52]/10 flex items-center justify-center font-bold text-[#b86b52]">
                          {(p.full_name || 'P').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="text-[#231815] font-bold flex items-center gap-1">
                            {p.full_name || 'Unnamed Paramedic'}

                            {p.is_verified && (
                              <ShieldCheck className="h-3 w-3 text-green-600" />
                            )}
                          </p>

                          <p className="text-black/40 text-xs font-mono">
                            {p.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-black/60 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-black/35" />
                        {p.phone_number || '—'}
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="text-[#231815] font-semibold">
                        {p.vehicle_registration || '—'}
                      </p>

                      <p className="text-black/40 text-xs">
                        {p.vehicle_type || 'Standard Ambulance'}
                      </p>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          p.is_online
                            ? 'bg-green-100 border-green-200 text-green-700'
                            : 'bg-red-100 border-red-200 text-red-600'
                        }`}
                      >
                        {p.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>

                    <td className="p-4">
                      {p.rating ? (
                        <span className="flex items-center gap-1 text-[#231815] font-bold">
                          {Number(p.rating).toFixed(1)}
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </span>
                      ) : (
                        <span className="text-black/35 text-sm">
                          No rating
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs font-mono">
                      {p.current_lat && p.current_lng ? (
                        <span className="text-green-700 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.current_lat.toFixed(4)}, {p.current_lng.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-black/35">
                          No GPS
                        </span>
                      )}
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