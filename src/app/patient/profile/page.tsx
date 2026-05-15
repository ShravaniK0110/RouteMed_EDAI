'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { User, CreditCard, ShieldCheck, History, HelpCircle, LogOut, Heart } from 'lucide-react'

interface PatientData {
  id: string
  full_name: string
  phone: string
  total_rides?: number
}

export default function PatientProfile() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      // 1. Get id from localStorage
      const raw = localStorage.getItem('user')
      if (!raw) {
        router.push('/auth/patient/signup')
        return
      }

      const { id } = JSON.parse(raw)

      // 2. Fetch real data from Supabase
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, phone')
        .eq('id', id)
        .single()

      if (error || !data) {
        // Fallback to localStorage name if DB fetch fails
        const { name } = JSON.parse(raw)
        setPatient({ id, full_name: name || 'Patient', phone: '' })
      } else {
        setPatient(data)
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    )
  }

  const initials = patient?.full_name
    ? patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P'

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Profile & Wallet</h1>

      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <div className="w-24 h-24 bg-blue-500/10 border-2 border-blue-500/30 rounded-full flex items-center justify-center">
          <span className="text-3xl font-black text-blue-400">{initials}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{patient?.full_name}</h2>
          <p className="text-slate-400">{patient?.phone || 'No phone on record'}</p>
          <div className="mt-2 flex gap-2">
            <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
              Verified Identity
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Wallet Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-400 font-medium mb-1">AR Wallet Balance</p>
                <h3 className="text-4xl font-black text-white">₹ 0.00</h3>
                <p className="text-xs text-slate-500 mt-1">Wallet coming soon</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex gap-3">
              <button
                disabled
                className="flex-1 py-2 bg-blue-600/50 text-white/50 rounded-lg font-bold text-sm cursor-not-allowed"
              >
                Add Money
              </button>
              <button
                disabled
                className="flex-1 py-2 bg-slate-800/50 text-white/50 rounded-lg font-bold text-sm cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Card */}
        <Card>
          <CardContent className="p-0 divide-y divide-slate-800">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <Heart className="h-5 w-5 text-red-400" /> Medical Info & Allergies
              </div>
              <span className="text-blue-500 text-sm">Edit</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <ShieldCheck className="h-5 w-5 text-green-400" /> Emergency Contacts
              </div>
              <span className="text-blue-500 text-sm">Manage</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <History className="h-5 w-5 text-purple-400" /> Ride History
              </div>
              <span className="text-slate-500 text-sm">Coming soon</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <HelpCircle className="h-5 w-5 text-slate-400" /> Support & Safety
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full p-4 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold"
      >
        <LogOut className="h-5 w-5" /> Sign Out
      </button>
    </div>
  )
}