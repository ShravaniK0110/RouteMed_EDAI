'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'

interface Patient {
  id: string
  full_name: string | null
  phone_number: string | null
  email: string | null
  created_at: string | null
}

export default function AdminUsers() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = async () => {
    setLoading(true)
    setError(null)

    const { data, error: dbError } = await supabase
      .from('patients')
      .select(`
        id,
        full_name,
        phone_number,
        email,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (dbError) {
      setError(dbError.message)
      setPatients([])
      setFiltered([])
    } else {
      setPatients(data || [])
      setFiltered(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase().trim()

    if (!q) {
      setFiltered(patients)
      return
    }

    setFiltered(
      patients.filter((p) =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.phone_number || '').includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      )
    )
  }, [search, patients])

  const formatDate = (value: string | null) => {
    if (!value) return '—'

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#b86b52]/70 mb-1">
            Admin
          </p>

          <h1 className="text-4xl font-black text-[#231815] flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-[#b86b52]" />
            Patient Records
          </h1>

          {!loading && (
            <p className="text-black/50 text-sm mt-2">
              {patients.length} registered patients
            </p>
          )}
        </div>

        <button
          onClick={fetchPatients}
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
          placeholder="Search patients by name, phone, or email..."
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
          Failed to load patients: {error}
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#b86b52] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-black/40">
            No patients found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 text-left">
                  <th className="p-4 text-xs uppercase text-black/40">
                    Patient
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Phone
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Email
                  </th>

                  <th className="p-4 text-xs uppercase text-black/40">
                    Registered
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 hover:bg-[#faf7f3]"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#b86b52]/10 text-[#b86b52] flex items-center justify-center font-black">
                          {(p.full_name || 'P').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="font-bold text-[#231815]">
                            {p.full_name || 'Unnamed Patient'}
                          </p>

                          <p className="text-xs text-black/40 font-mono">
                            {p.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-black/60 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-black/35" />
                        {p.phone_number || '—'}
                      </div>
                    </td>

                    <td className="p-4 text-black/60 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-black/35" />
                        {p.email || '—'}
                      </div>
                    </td>

                    <td className="p-4 text-black/60 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-black/35" />
                        {formatDate(p.created_at)}
                      </div>
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