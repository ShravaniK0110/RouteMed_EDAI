'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, ShieldCheck, History, HelpCircle, LogOut, Heart } from 'lucide-react'

interface PatientData {
  id: string
  full_name: string
  phone: string
}

export default function PatientProfile() {
  const router = useRouter()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const raw = localStorage.getItem('user')
      if (!raw) { router.push('/auth/patient/signup'); return }
      const { id } = JSON.parse(raw)
      const { data, error } = await supabase.from('patients').select('id, full_name, phone').eq('id', id).single()
      if (error || !data) {
        const { name } = JSON.parse(raw)
        setPatient({ id, full_name: name || 'Patient', phone: '' })
      } else {
        setPatient(data)
      }
      setLoading(false)
    }
    loadProfile()
  }, [router])

  const handleSignOut = () => { localStorage.removeItem('user'); router.push('/') }

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const initials = patient?.full_name
    ? patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'P'

  const menuItems = [
    { icon: Heart, label: 'Medical Info & Allergies', action: 'Edit', color: 'text-accent' },
    { icon: ShieldCheck, label: 'Emergency Contacts', action: 'Manage', color: 'text-primary' },
    { icon: History, label: 'Ride History', action: 'Soon', color: 'text-dark' },
    { icon: HelpCircle, label: 'Support & Safety', action: '', color: 'text-dark' },
  ]

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-dark/50 mb-0.5">Account</p>
        <h1 className="text-2xl font-bold text-ink">Profile & Wallet</h1>
      </div>

      <div className="flex items-center gap-5 p-5 bg-paper border border-primary/20 rounded-xl">
        <div className="w-16 h-16 bg-primary/15 border-2 border-primary/30 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-xl font-black text-primary">{initials}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">{patient?.full_name}</h2>
          <p className="text-dark font-mono text-sm">{patient?.phone || 'No phone on record'}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded font-mono uppercase tracking-wider border border-green-200">
            Verified
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-ink rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">AR Wallet</p>
              <h3 className="text-3xl font-black text-white font-mono">₹0.00</h3>
              <p className="text-white/30 text-xs mt-1">Coming soon</p>
            </div>
            <CreditCard className="h-6 w-6 text-primary/60" />
          </div>
          <div className="flex gap-2">
            <button disabled className="flex-1 py-2 bg-white/10 text-white/30 rounded-lg text-xs font-bold cursor-not-allowed">Add Money</button>
            <button disabled className="flex-1 py-2 bg-white/10 text-white/30 rounded-lg text-xs font-bold cursor-not-allowed">Send</button>
          </div>
        </div>

        <div className="bg-paper border border-primary/20 rounded-xl overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <button key={item.label}
                className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-white transition-colors text-left ${i > 0 ? 'border-t border-primary/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <span className="text-sm font-medium text-ink">{item.label}</span>
                </div>
                {item.action && <span className="text-xs text-primary/60 font-mono">{item.action}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={handleSignOut}
        className="w-full py-3 flex items-center justify-center gap-2 text-accent hover:bg-accent/5 rounded-xl transition-colors text-sm font-semibold border border-accent/20">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
    </div>
  )
}