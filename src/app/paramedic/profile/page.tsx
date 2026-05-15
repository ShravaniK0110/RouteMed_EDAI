'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Truck, DollarSign, Activity, FileText, Settings, LogOut, Star } from 'lucide-react'

interface ParamedicData {
  id: string
  full_name: string
  phone: string
  vehicle_registration: string
  is_online: boolean
  average_rating: number | null
}

export default function ParamedicProfile() {
  const router = useRouter()
  const [paramedic, setParamedic] = useState<ParamedicData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const raw = localStorage.getItem('user')
      if (!raw) {
        router.push('/auth/paramedic/signup')
        return
      }

      const { id } = JSON.parse(raw)

      const { data, error } = await supabase
        .from('paramedics')
        .select('id, full_name, phone, vehicle_registration, is_online, average_rating')
        .eq('id', id)
        .single()

      if (error || !data) {
        const { name } = JSON.parse(raw)
        setParamedic({
          id,
          full_name: name || 'Paramedic',
          phone: '',
          vehicle_registration: '',
          is_online: false,
          average_rating: null,
        })
      } else {
        setParamedic(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [router])

  const handleSignOut = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" />
      </div>
    )
  }

  const initials = paramedic?.full_name
    ? paramedic.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P'

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Paramedic Profile</h1>

      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center">
          <span className="text-3xl font-black text-green-400">{initials}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{paramedic?.full_name}</h2>
          <p className="text-slate-400">
            {paramedic?.vehicle_registration || 'No vehicle registered'}
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            {paramedic?.average_rating ? (
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/20 flex items-center gap-1">
                {paramedic.average_rating.toFixed(1)} <Star className="h-3 w-3 fill-yellow-400" />
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-full border border-slate-700">
                No ratings yet
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
              paramedic?.is_online
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {paramedic?.is_online ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Earnings Card — static for now, wallet not built */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-400 font-medium mb-1">Total Earnings</p>
                <h3 className="text-3xl font-black text-white">Coming Soon</h3>
                <p className="text-xs text-slate-500 mt-1">Wallet system in development</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <button
              disabled
              className="w-full py-2 bg-slate-800/50 text-white/40 rounded-lg font-bold text-sm cursor-not-allowed border border-slate-700/50"
            >
              Withdraw to Bank
            </button>
          </CardContent>
        </Card>

        {/* Menu Card */}
        <Card>
          <CardContent className="p-0 divide-y divide-slate-800">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <Activity className="h-5 w-5 text-blue-400" /> Performance Stats
              </div>
              <span className="text-slate-500 text-sm">Coming soon</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <FileText className="h-5 w-5 text-yellow-400" /> Documents & Licenses
              </div>
              <span className="text-green-500 text-xs font-bold border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">
                Verified
              </span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <Truck className="h-5 w-5 text-purple-400" /> Vehicle Settings
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <Settings className="h-5 w-5 text-slate-400" /> App Settings
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full p-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold mt-4"
      >
        <LogOut className="h-5 w-5" /> Sign Out
      </button>
    </div>
  )
}