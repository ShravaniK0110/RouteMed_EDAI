'use client'

import { useState, useEffect } from 'react'

import {
  MapPin,
  Search,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

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
}

const STATUS_STYLE: Record<string, string> = {
  searching:
    'bg-yellow-100 text-yellow-700 border-yellow-200',

  accepted:
    'bg-blue-100 text-blue-700 border-blue-200',

  completed:
    'bg-green-100 text-green-700 border-green-200',

  cancelled:
    'bg-red-100 text-red-700 border-red-200',
}

const SEVERITY_STYLE: Record<string, string> = {
  Critical: 'text-red-500',
  High: 'text-orange-500',
  Medium: 'text-yellow-600',
  Low: 'text-green-600',
}

const ALL_STATUSES = [
  'All',
  'searching',
  'accepted',
  'completed',
  'cancelled',
]

export default function AdminRides() {

  const [rides, setRides] =
    useState<Ride[]>([])

  const [filtered, setFiltered] =
    useState<Ride[]>([])

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('All')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const fetchRides = async () => {

    setLoading(true)

    setError(null)

    try {

      const token =
        localStorage.getItem('token')

      const res =
        await fetch('/api/admin/rides', {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        })

      const data =
        await res.json()

      if (!res.ok) {

        setError(
          data.error ||
            'Failed to load rides'
        )

      } else {

        setRides(data.rides || [])

        setFiltered(data.rides || [])
      }

    } catch {

      setError(
        'Network error — server unavailable'
      )

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    fetchRides()

  }, [])

  useEffect(() => {

    let result = rides

    if (statusFilter !== 'All') {

      result = result.filter(
        r => r.status === statusFilter
      )
    }

    if (search.trim()) {

      const q =
        search.toLowerCase()

      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.emergency_type?.toLowerCase().includes(q) ||
        r.paramedic_name?.toLowerCase().includes(q) ||
        r.vehicle?.toLowerCase().includes(q)
      )
    }

    setFiltered(result)

  }, [
    search,
    statusFilter,
    rides
  ])

  const formatTime = (iso: string) => {

    const d = new Date(iso)

    return d.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    )
  }

  const counts = {
    total:
      rides.length,

    active:
      rides.filter(r =>
        ['searching', 'accepted']
          .includes(r.status)
      ).length,

    completed:
      rides.filter(r =>
        r.status === 'completed'
      ).length,

    revenue:
      rides
        .filter(r =>
          r.status === 'completed'
        )
        .reduce(
          (sum, r) =>
            sum + (r.total_fare || 0),
          0
        ),
  }

  return (

    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <p className="text-xs uppercase tracking-[0.25em] text-[#b86b52]/70 mb-1">
            Admin
          </p>

          <h1 className="text-4xl font-black text-[#231815] flex items-center gap-3">
            <MapPin className="h-8 w-8 text-[#b86b52]" />
            Ride Operations
          </h1>

          {!loading && (

            <p className="text-black/50 text-sm mt-2">

              {counts.total} total rides ·
              {' '}
              {counts.active} active ·
              {' '}
              {counts.completed} completed ·
              {' '}
              ₹{counts.revenue.toLocaleString('en-IN')}

            </p>
          )}
        </div>

        <button
          onClick={fetchRides}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 hover:border-[#b86b52]/30 transition-all w-fit"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          <span className="text-sm font-semibold">
            Refresh
          </span>
        </button>
      </div>

      {/* Filters */}

      <div className="flex flex-col lg:flex-row gap-4">

        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black/40" />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search rides, paramedics, emergency..."
            className="w-full bg-white border border-black/10 rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-[#b86b52]/40"
          />
        </div>

        <div className="flex gap-2 flex-wrap">

          {ALL_STATUSES.map((s) => (

            <button
              key={s}
              onClick={() =>
                setStatusFilter(s)
              }
              className={`px-4 py-2 rounded-xl border text-sm font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#b86b52] text-white border-[#b86b52]'
                  : 'bg-white border-black/10 text-black/60 hover:border-[#b86b52]/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}

      {error && (

        <div className="flex items-center gap-3 bg-red-100 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">

          <AlertTriangle className="h-5 w-5 shrink-0" />

          {error}

        </div>
      )}

      {/* Table */}

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">

        {loading ? (

          <div className="flex items-center justify-center py-20">

            <div className="w-8 h-8 border-2 border-[#b86b52] border-t-transparent rounded-full animate-spin" />

          </div>

        ) : filtered.length === 0 ? (

          <div className="text-center py-20 text-black/40">

            No rides found

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b border-black/5 text-left">

                  <th className="p-4 text-xs uppercase text-black/40">
                    Ride ID
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Time
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Emergency
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Severity
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Paramedic
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Status
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Distance
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40 text-right">
                    Fare
                  </th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((ride) => (

                  <tr
                    key={ride.id}
                    className="border-b border-black/5 hover:bg-[#faf7f3]"
                  >

                    <td className="p-4 font-mono text-xs text-black/50">
                      {ride.id.slice(0, 8)}...
                    </td>

                    <td className="p-4 text-sm text-black/70 whitespace-nowrap">
                      {formatTime(
                        ride.created_at
                      )}
                    </td>

                    <td className="p-4 font-semibold text-[#231815]">
                      {ride.emergency_type || '—'}
                    </td>

                    <td className="p-4">

                      <span
                        className={`font-bold ${
                          SEVERITY_STYLE[
                            ride.severity
                          ] ||
                          'text-black/40'
                        }`}
                      >
                        {ride.severity || '—'}
                      </span>
                    </td>

                    <td className="p-4">

                      <p className="font-medium text-[#231815]">
                        {ride.paramedic_name}
                      </p>

                      {ride.vehicle !== 'N/A' && (

                        <p className="text-xs text-black/40">
                          {ride.vehicle}
                        </p>
                      )}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          STATUS_STYLE[
                            ride.status
                          ]
                        }`}
                      >
                        {ride.status}
                      </span>
                    </td>

                    <td className="p-4 text-black/50 text-sm">

                      {ride.distance_km
                        ? `${ride.distance_km} km`
                        : '—'}
                    </td>

                    <td className="p-4 text-right font-bold text-[#231815]">

                      {ride.total_fare
                        ? `₹${ride.total_fare}`
                        : '—'}
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