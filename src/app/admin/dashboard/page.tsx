'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Truck, Building2, BrainCircuit, Activity, Clock, RefreshCw, AlertTriangle } from 'lucide-react'

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

interface PendingApproval {
  id: string
  name: string
  vehicle: string
}

const STATUS_STYLE: Record<string, string> = {
  searching:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  accepted:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
  completed:  'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled:  'bg-red-500/10 text-red-400 border-red-500/30',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [criticalRides, setCriticalRides] = useState<CriticalRide[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [mlStats, setMlStats] = useState({ accuracy: '—', count: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [dashRes, mlRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/ml/model-stats'),
      ])

      const dash = await dashRes.json()
      const ml = await mlRes.json()

      if (dash.success) {
        setStats(dash.stats)
        setCriticalRides(dash.recent_critical_rides || [])
        setPendingApprovals(dash.pending_approvals || [])
      }

      if (ml.success) {
        setMlStats({ accuracy: ml.accuracy, count: ml.count })
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const statCards = [
    {
      label: 'Active Rides',
      value: stats?.active_rides ?? '—',
      icon: <Activity className="h-6 w-6 text-red-500" />,
      bg: 'bg-red-500/10',
      pulse: (stats?.active_rides ?? 0) > 0,
    },
    {
      label: 'Online Paramedics',
      value: stats?.online_paramedics ?? '—',
      icon: <Truck className="h-6 w-6 text-primary" />,
      bg: 'bg-primary/10',
    },
    {
      label: 'Registered Patients',
      value: stats?.total_users ?? '—',
      icon: <Users className="h-6 w-6 text-accent" />,
      bg: 'bg-accent/10',
    },
    {
      label: 'ML Model Accuracy',
      value: mlStats.accuracy !== '—' ? `${mlStats.accuracy}%` : '—',
      icon: <BrainCircuit className="h-6 w-6 text-green-600" />,
      bg: 'bg-green-500/10',
      sub: mlStats.count > 0 ? `${mlStats.count} predictions` : undefined,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-dark">Operations Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-xs text-dark/40 hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-secondary border border-primary/20 rounded-lg text-sm text-dark/70 hover:text-dark transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-secondary border-primary/20 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.bg} rounded-full flex items-center justify-center`}>
                  {card.icon}
                </div>
                {card.pulse && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-dark/70 font-medium text-sm">{card.label}</p>
              <h3 className="text-3xl font-bold text-dark mt-1">
                {loading ? <span className="text-dark/20">—</span> : card.value}
              </h3>
              {card.sub && (
                <p className="text-xs text-dark/40 mt-1">{card.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Critical Rides */}
        <Card className="bg-white border-primary/20 shadow-md">
          <CardHeader className="border-b border-secondary pb-4">
            <CardTitle className="text-dark flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Recent Critical Rides
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-secondary">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
              </div>
            ) : criticalRides.length === 0 ? (
              <p className="text-center text-dark/40 py-10 text-sm">No critical rides yet</p>
            ) : (
              criticalRides.map((ride) => (
                <div key={ride.id} className="p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-dark">
                      {ride.paramedic !== 'Unassigned' ? ride.paramedic : 'Awaiting dispatch'}
                    </p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${STATUS_STYLE[ride.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {ride.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-dark/50 mt-1 font-mono">
                    ID: {ride.id.slice(0, 8)}... · Severity: {ride.severity}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="bg-white border-primary/20 shadow-md">
          <CardHeader className="border-b border-secondary pb-4">
            <CardTitle className="text-dark flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Paramedic Approvals
              {pendingApprovals.length > 0 && (
                <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded-full font-bold">
                  {pendingApprovals.length} pending
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-secondary">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <p className="text-center text-dark/40 py-10 text-sm">All paramedics verified ✓</p>
            ) : (
              pendingApprovals.map((p) => (
                <div key={p.id} className="p-4 hover:bg-secondary/50 transition-colors flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-dark">{p.name}</p>
                    <p className="text-xs text-dark/50 mt-0.5">{p.vehicle || 'No vehicle registered'}</p>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-500 font-bold border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    Review
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Revenue */}
      {stats?.platform_revenue && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-md">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-dark/60 font-medium text-sm">Platform Revenue (15% fee on completed rides)</p>
              <h3 className="text-3xl font-black text-dark mt-1">
                ₹ {Number(stats.platform_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <Building2 className="h-12 w-12 text-primary/30" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}