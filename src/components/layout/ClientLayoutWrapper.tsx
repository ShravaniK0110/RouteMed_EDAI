'use client'

import { usePathname } from 'next/navigation'

import Sidebar from '@/components/layout/Sidebar'

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // ONLY show sidebar for admin routes
  const showAdminSidebar =
    pathname.startsWith('/admin')

  return (
    <div className="flex min-h-screen overflow-hidden">
      {showAdminSidebar && (
        <Sidebar />
      )}

      <main
        className={`flex-1 overflow-y-auto p-8 ${
          showAdminSidebar
            ? 'ml-64'
            : ''
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}