'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Search, RefreshCw, AlertTriangle } from 'lucide-react'

interface Ride {
  id: string
  status: string
  emergency_type: string
  severity: string
  paramedic_name: string
  vehicle: string
  total_fare: number | null
  distance_km: number | null
  created_at: string
  pickup_lat: number
  pickup_lng: number
}

const STATUS_STYLE: Record<string, string> = {
  searching:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  accepted:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
  completed:  'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled:  'bg-red-500/10 text-red-400 border-red-500/30',
}

const SEVERITY_STYLE: Record<string, string> = {
  Critical: 'text-red-400',
  High:     'text-orange-400',
  Medium:   'text-yellow-400',
  Low:      'text-green-400',
}

const ALL_STATUSES = ['All', 'searching', 'accepted', 'completed', 'cancelled']

export default function AdminRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [filtered, setFiltered] = useState<Ride[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRides = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/rides', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load rides')
      } else {
        setRides(data.rides || [])
        setFiltered(data.rides || [])
      }
    } catch (err) {
      setError('Network error — is the server running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRides() }, [])

  // Filter whenever search or status filter changes
  useEffect(() => {
    let result = rides

    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.emergency_type?.toLowerCase().includes(q) ||
        r.paramedic_name?.toLowerCase().includes(q) ||
        r.vehicle?.toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [search, statusFilter, rides])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  // Summary counts
  const counts = {
    total: rides.length,
    active: rides.filter(r => ['searching', 'accepted'].includes(r.status)).length,
    completed: rides.filter(r => r.status === 'completed').length,
    revenue: rides
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.total_fare || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MapPin className="h-8 w-8 text-red-500" />
            Global Ride History
          </h1>
          {!loading && (
            <p className="text-slate-400 text-sm mt-1">
              {counts.total} total · {counts.active} active · {counts.completed} completed · ₹{counts.revenue.toLocaleString('en-IN')} revenue
            </p>
          )}
        </div>
        <button
          onClick={fetchRides}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-sm border border-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none text-sm"
            placeholder="Search by ride ID, paramedic, emergency type..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
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
              {search || statusFilter !== 'All'
                ? 'No rides match your filters'
                : 'No rides in the system yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Ride ID</th>
                    <th className="p-4 font-medium">Time</th>
                    <th className="p-4 font-medium">Emergency</th>
                    <th className="p-4 font-medium">Severity</th>
                    <th className="p-4 font-medium">Paramedic</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Distance</th>
                    <th className="p-4 font-medium text-right">Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((ride) => (
                    <tr key={ride.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="p-4">
                        <p className="font-mono text-xs text-slate-400">{ride.id.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4 text-slate-300 text-xs whitespace-nowrap">
                        {formatTime(ride.created_at)}
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm font-medium">{ride.emergency_type || '—'}</p>
                      </td>
                      <td className="p-4">
                        <p className={`text-sm font-bold ${SEVERITY_STYLE[ride.severity] || 'text-slate-400'}`}>
                          {ride.severity || '—'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-300 text-sm">{ride.paramedic_name}</p>
                        {ride.vehicle !== 'N/A' && (
                          <p className="text-slate-600 text-xs">{ride.vehicle}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLE[ride.status] || 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {ride.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {ride.distance_km ? `${ride.distance_km} km` : '—'}
                      </td>
                      <td className="p-4 text-right">
                        {ride.total_fare ? (
                          <p className="text-white font-bold">₹{ride.total_fare}</p>
                        ) : (
                          <p className="text-slate-600 text-sm">—</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}