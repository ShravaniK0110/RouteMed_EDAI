'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname.startsWith('/patient') || pathname.startsWith('/paramedic') || pathname.startsWith('/admin')

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${showSidebar ? 'ml-64' : ''} p-8`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
