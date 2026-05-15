'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Search, Table as TableIcon } from 'lucide-react'

export default function DatabaseViewer() {
  const [activeTable, setActiveTable] = useState('Users')

  const tables = ['Users', 'Paramedics', 'Hospitals', 'AmbulanceRequests', 'Rides', 'ParamedicScore']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Database Viewer
        </h1>
      </div>

      <div className="flex gap-6">
          <div className="w-64 shrink-0 space-y-2">
              <h3 className="font-bold text-dark/50 text-xs uppercase tracking-wider mb-4 px-2">Available Tables</h3>
              {tables.map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTable(t)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${activeTable === t ? 'bg-primary text-white shadow-md' : 'bg-white text-dark hover:bg-secondary border border-primary/10'}`}
                  >
                      <TableIcon className={`h-4 w-4 ${activeTable === t ? 'text-white' : 'text-primary'}`} />
                      {t}
                  </button>
              ))}
          </div>

          <Card className="flex-1 bg-white border-primary/20 shadow-md">
            <CardHeader className="border-b border-secondary flex flex-row items-center justify-between">
                <CardTitle className="text-dark">Table: {activeTable}</CardTitle>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark/40" />
                    <input type="text" placeholder={`Search ${activeTable}...`} className="pl-9 pr-4 py-2 bg-secondary border border-primary/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-secondary/50 text-dark/60 text-xs uppercase">
                        <tr>
                            <th className="p-4 font-bold border-b border-primary/10">ID</th>
                            <th className="p-4 font-bold border-b border-primary/10">Created At</th>
                            <th className="p-4 font-bold border-b border-primary/10">Data Segment 1</th>
                            <th className="p-4 font-bold border-b border-primary/10">Data Segment 2</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary text-sm text-dark">
                        <tr className="hover:bg-secondary/30">
                            <td className="p-4 font-mono text-primary">cuid_mock_1</td>
                            <td className="p-4">2024-05-20 14:30:00</td>
                            <td className="p-4">Sample Value A</td>
                            <td className="p-4">Sample Value B</td>
                        </tr>
                        <tr className="hover:bg-secondary/30">
                            <td className="p-4 font-mono text-primary">cuid_mock_2</td>
                            <td className="p-4">2024-05-20 15:45:00</td>
                            <td className="p-4">Sample Value X</td>
                            <td className="p-4">Sample Value Y</td>
                        </tr>
                    </tbody>
                </table>
                <div className="p-4 text-center text-dark/50 text-sm italic border-t border-secondary">
                    Displaying 2 of 2 records. Read-only viewer.
                </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
