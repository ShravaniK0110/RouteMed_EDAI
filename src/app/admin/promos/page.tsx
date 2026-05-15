'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

export default function AdminPromos() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Star className="h-8 w-8 text-blue-500" />
            Promo Codes & Offers
        </h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">Create Promo</button>
      </div>
      <Card className="bg-slate-900 border-slate-800 p-8 text-center text-slate-400">
        <Star className="h-16 w-16 mx-auto mb-4 text-slate-700" />
        <p>Promo code management system goes here.</p>
      </Card>
    </div>
  )
}
