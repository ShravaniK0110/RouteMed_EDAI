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
interface CriticalRide { id: string; status: string; severity: string; paramedic: string }
interface PendingApproval { id: string; name: string; vehicle: string }

const STATUS_STYLE: Record<string, string> = {
  searching: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  accepted:  'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
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
      const [dashRes, mlRes] = await Promise.all([fetch('/api/admin/dashboard'), fetch('/api/ml/model-stats')])
      const dash = await dashRes.json()
      const ml = await mlRes.json()
      if (dash.success) { setStats(dash.stats); setCriticalRides(dash.recent_critical_rides || []); setPendingApprovals(dash.pending_approvals || []) }
      if (ml.success) setMlStats({ accuracy: ml.accuracy, count: ml.count })
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const statCards = [
    { label: 'Active Rides', value: stats?.active_rides ?? '—', Icon: Activity, color: 'text-accent', bg: 'bg-accent/10', pulse: (stats?.active_rides ?? 0) > 0 },
    { label: 'Online Paramedics', value: stats?.online_paramedics ?? '—', Icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Registered Patients', value: stats?.total_users ?? '—', Icon: Users, color: 'text-ink', bg: 'bg-ink/10' },
    { label: 'ML Accuracy', value: mlStats.accuracy !== '—' ? `${mlStats.accuracy}%` : '—', Icon: BrainCircuit, color: 'text-green-700', bg: 'bg-green-100', sub: mlStats.count > 0 ? `${mlStats.count} predictions` : undefined },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-dark/50 mb-0.5">Admin</p>
          <h1 className="text-2xl font-bold text-ink">Operations Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs font-mono text-dark/40 hidden sm:block">{lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-paper border border-primary/20 rounded-lg text-sm text-dark hover:border-primary transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-paper border border-primary/20 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              {card.pulse && (
                <span className="flex items-center gap-1 text-[10px] text-accent font-bold font-mono uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live
                </span>
              )}
            </div>
            <p className="text-xs text-dark/60 font-medium">{card.label}</p>
            <h3 className="text-2xl font-black text-ink mt-0.5 font-mono">
              {loading ? <span className="text-dark/20">—</span> : card.value}
            </h3>
            {card.sub && <p className="text-[10px] text-dark/40 mt-0.5 font-mono">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-paper border border-primary/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <h2 className="font-semibold text-ink text-sm">Recent Critical Rides</h2>
          </div>
          <div className="divide-y divide-primary/10">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : criticalRides.length === 0 ? (
              <p className="text-center text-dark/40 py-10 text-sm font-mono">No critical rides yet</p>
            ) : (
              criticalRides.map((ride) => (
                <div key={ride.id} className="px-5 py-3.5 hover:bg-white/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">
                      {ride.paramedic !== 'Unassigned' ? ride.paramedic : 'Awaiting dispatch'}
                    </p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border font-mono ${STATUS_STYLE[ride.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {ride.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-dark/50 mt-0.5 font-mono">
                    {ride.id.slice(0, 8)}… · {ride.severity}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-paper border border-primary/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/10 flex items-center gap-2">
            <Clock className="h-4 w-4 text-dark" />
            <h2 className="font-semibold text-ink text-sm">Pending Approvals</h2>
            {pendingApprovals.length > 0 && (
              <span className="ml-auto text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded font-bold font-mono">
                {pendingApprovals.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-primary/10">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pendingApprovals.length === 0 ? (
              <p className="text-center text-dark/40 py-10 text-sm font-mono">All paramedics verified ✓</p>
            ) : (
              pendingApprovals.map((p) => (
                <div key={p.id} className="px-5 py-3.5 hover:bg-white/60 transition-colors flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-dark/50 mt-0.5 font-mono">{p.vehicle || 'No vehicle registered'}</p>
                  </div>
                  <button className="text-xs font-bold border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {stats?.platform_revenue && (
        <div className="bg-ink rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Platform Revenue · 15% fee</p>
            <h3 className="text-3xl font-black text-white font-mono">
              ₹ {Number(stats.platform_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <Building2 className="h-10 w-10 text-primary/40" />
        </div>
      )}
    </div>
  )
}