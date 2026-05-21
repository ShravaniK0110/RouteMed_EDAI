'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Users,
  Truck,
  Building2,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  active_rides: number
  online_paramedics: number
  total_users: number
  platform_revenue: string
}

interface CriticalRide {
  id: string
  status: string
  severity: string
  paramedic: string
}

const STATUS_STYLE: Record<string, string> = {
  searching: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const emergencyDistribution = [
  { name: 'Medical', value: 45 },
  { name: 'Accident', value: 25 },
  { name: 'Cardiac', value: 15 },
  { name: 'Trauma', value: 15 },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const [criticalRides, setCriticalRides] = useState<CriticalRide[]>([])

  const [loading, setLoading] = useState(true)

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {

    setLoading(true)

    try {

      const dashRes =
        await fetch('/api/admin/dashboard')

      const dash =
        await dashRes.json()

      if (dash.success) {

        setStats(dash.stats)

        setCriticalRides(
          dash.recent_critical_rides || []
        )
      }

      setLastUpdated(new Date())

    } catch (err) {

      console.error(
        'Dashboard fetch error:',
        err
      )

    } finally {

      setLoading(false)
    }

  }, [])

  useEffect(() => {

    fetchAll()

    const interval =
      setInterval(fetchAll, 30000)

    return () =>
      clearInterval(interval)

  }, [fetchAll])

  const statCards = [
    {
      label: 'Active Rides',
      value: stats?.active_rides ?? '—',
      Icon: Activity,
      color: 'text-red-500',
      bg: 'bg-red-100',
    },
    {
      label: 'Online Paramedics',
      value: stats?.online_paramedics ?? '—',
      Icon: Truck,
      color: 'text-[#b86b52]',
      bg: 'bg-[#b86b52]/10',
    },
    {
      label: 'Registered Patients',
      value: stats?.total_users ?? '—',
      Icon: Users,
      color: 'text-slate-700',
      bg: 'bg-slate-200',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#b86b52]/70 mb-1">
            Admin
          </p>

          <h1 className="text-4xl font-black text-[#231815] leading-tight">
            Operations Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">

          {lastUpdated && (
            <span className="text-xs text-black/40 hidden sm:block">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/10 hover:border-[#b86b52]/30 transition-all"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {statCards.map((card) => (

          <div
            key={card.label}
            className="bg-white border border-black/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                <card.Icon className={`h-5 w-5 ${card.color}`} />
              </div>

            </div>

            <p className="text-sm text-black/50 font-medium">
              {card.label}
            </p>

            <h3 className="text-4xl font-black text-[#231815] mt-2">
              {loading ? '—' : card.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">

          <div className="px-5 py-4 border-b border-black/5 flex items-center gap-2">

            <AlertTriangle className="h-4 w-4 text-red-500" />

            <h2 className="font-bold text-[#231815]">
              Recent Critical Rides
            </h2>
          </div>

          <div className="divide-y divide-black/5">

            {loading ? (

              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#b86b52] border-t-transparent rounded-full animate-spin" />
              </div>

            ) : criticalRides.length === 0 ? (

              <p className="text-center text-black/40 py-12">
                No critical rides yet
              </p>

            ) : (

              criticalRides.map((ride) => (

                <div
                  key={ride.id}
                  className="px-5 py-4"
                >
                  <div className="flex items-center justify-between">

                    <p className="font-semibold text-[#231815]">
                      {ride.paramedic !== 'Unassigned'
                        ? ride.paramedic
                        : 'Awaiting dispatch'}
                    </p>

                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                        STATUS_STYLE[ride.status]
                      }`}
                    >
                      {ride.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-black/40 mt-1">
                    {ride.id.slice(0, 8)} • {ride.severity}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5">

          <div className="flex items-center gap-2 mb-4">

            <Activity className="h-4 w-4 text-[#b86b52]" />

            <h2 className="font-bold text-[#231815]">
              Emergency Distribution
            </h2>
          </div>

          <div className="h-72 w-full">

            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie
                  data={emergencyDistribution}
                  dataKey="value"
                  outerRadius={90}
                  label
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#dc2626" />
                  <Cell fill="#16a34a" />
                  <Cell fill="#ca8a04" />
                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {stats?.platform_revenue && (

        <div className="bg-[#231815] rounded-2xl p-7 flex items-center justify-between">

          <div>

            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-2">
              Platform Revenue
            </p>

            <h3 className="text-4xl font-black text-white">
              ₹{' '}
              {Number(
                stats.platform_revenue
              ).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>

          <Building2 className="h-10 w-10 text-[#b86b52]" />
        </div>
      )}
    </div>
  )
}