'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Truck, Search, Star, ShieldCheck, RefreshCw } from 'lucide-react'

interface Paramedic {
  id: string
  full_name: string
  vehicle_registration: string
  phone: string
  is_online: boolean
  lat: number | null
  lng: number | null
  average_rating: number | null
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
      .select('id, full_name, vehicle_registration, phone, is_online, lat, lng, average_rating')
      .order('full_name', { ascending: true })

    if (dbError) {
      setError(dbError.message)
    } else {
      setParamedics(data || [])
      setFiltered(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchParamedics()
  }, [])

  // Live search filter
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      paramedics.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.vehicle_registration?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      )
    )
  }, [search, paramedics])

  // Derive status from is_online + lat/lng
  const getStatus = (p: Paramedic) => {
    if (!p.is_online) return 'Offline'
    if (p.lat && p.lng) return 'Online'
    return 'Online' // online but GPS not fired yet
  }

  const getStatusStyle = (status: string) => {
    if (status === 'Online') return 'bg-green-500/10 border-green-500/30 text-green-400'
    if (status === 'In Ride') return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    return 'bg-slate-800 border-slate-700 text-slate-400'
  }

  const onlineCount = paramedics.filter(p => p.is_online).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-500" />
            Paramedics & Fleet Management
          </h1>
          {!loading && (
            <p className="text-slate-400 text-sm mt-1">
              {paramedics.length} registered · {onlineCount} online now
            </p>
          )}
        </div>
        <button
          onClick={fetchParamedics}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-sm border border-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none"
          placeholder="Search by name, vehicle, or phone..."
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Failed to load paramedics: {error}
        </div>
      )}

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              {search ? `No paramedics matching "${search}"` : 'No paramedics registered yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Paramedic</th>
                    <th className="p-4 font-medium">Vehicle</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Rating</th>
                    <th className="p-4 font-medium">GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((p) => {
                    const status = getStatus(p)
                    return (
                      <tr key={p.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                              {p.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-bold flex items-center gap-1">
                                {p.full_name}
                                <ShieldCheck className="h-3 w-3 text-green-500" />
                              </p>
                              <p className="text-slate-500 text-xs font-mono">{p.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-slate-300 font-medium">
                            {p.vehicle_registration || '—'}
                          </p>
                        </td>
                        <td className="p-4 text-slate-300 text-sm">
                          {p.phone || '—'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4">
                          {p.average_rating ? (
                            <span className="flex items-center gap-1 text-white font-bold">
                              {p.average_rating.toFixed(1)}
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">No ratings</span>
                          )}
                        </td>
                        <td className="p-4 text-xs font-mono">
                          {p.lat && p.lng ? (
                            <span className="text-green-400">
                              {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-slate-600">No GPS</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}