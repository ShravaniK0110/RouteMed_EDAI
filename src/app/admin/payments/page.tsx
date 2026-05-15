'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function AdminPayments() {
  const transactions = [
    { id: 'TXN-001', type: 'Ride Payment (Cash)', user: 'John Doe', driver: 'Ravi Kumar', amount: '₹ 450.00', platformFee: '₹ 67.50', status: 'Completed', date: '2024-05-20 14:30' },
    { id: 'TXN-002', type: 'Wallet Add', user: 'Anita S.', driver: '-', amount: '₹ 1,000.00', platformFee: '₹ 0.00', status: 'Completed', date: '2024-05-20 12:15' },
    { id: 'TXN-003', type: 'Driver Payout', user: '-', driver: 'Sanjay Singh', amount: '₹ 8,400.00', platformFee: '-', status: 'Processing', date: '2024-05-20 09:00' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            Financials & Payments
        </h1>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors border border-slate-700">
            <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
            <CardContent className="p-6">
                <p className="text-slate-400 font-medium mb-1">Total Platform Revenue (15% Cut)</p>
                <h3 className="text-4xl font-black text-white">₹ 2.4M</h3>
            </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
                <p className="text-slate-400 font-medium mb-1">Total Driver Payouts</p>
                <h3 className="text-4xl font-black text-white">₹ 13.6M</h3>
            </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
                <p className="text-slate-400 font-medium mb-1">Pending Settlements</p>
                <h3 className="text-4xl font-black text-white">₹ 145.2k</h3>
            </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Transaction ID</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">User / Driver</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Platform Fee</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="p-4">
                        <p className="text-white font-medium">{t.id}</p>
                        <p className="text-slate-500 text-xs">{t.date}</p>
                    </td>
                    <td className="p-4">
                        <span className={`flex items-center gap-1 font-medium ${t.type.includes('Payout') ? 'text-blue-400' : 'text-slate-300'}`}>
                            {t.type.includes('Payout') ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            {t.type}
                        </span>
                    </td>
                    <td className="p-4">
                        <p className="text-slate-300 text-sm">User: {t.user}</p>
                        <p className="text-slate-400 text-sm">Driver: {t.driver}</p>
                    </td>
                    <td className="p-4 text-white font-bold">{t.amount}</td>
                    <td className="p-4 text-green-400 font-medium">{t.platformFee}</td>
                    <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            t.status === 'Completed' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                        }`}>
                            {t.status}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
