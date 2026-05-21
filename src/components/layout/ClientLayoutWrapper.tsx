'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const showSidebar =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/patient') ||
    pathname.startsWith('/paramedic')

  return (
    <div className="flex min-h-screen overflow-hidden">
      {showSidebar && <Sidebar />}

      <main className={`flex-1 overflow-y-auto ${showSidebar ? 'p-8' : ''}`}>
        <div className={showSidebar ? 'max-w-7xl mx-auto' : ''}>
          {children}
        </div>
      </main>
    </div>
  )
}