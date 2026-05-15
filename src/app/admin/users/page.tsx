'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Users as UsersIcon, Search } from 'lucide-react'

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-purple-500" />
            User Management
        </h1>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Search by name, phone..." />
      </div>
      <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-400">
        <UsersIcon className="h-16 w-16 mx-auto mb-4 text-slate-700" />
        <p>User list populated from DB in production.</p>
      </Card>
    </div>
  )
}
