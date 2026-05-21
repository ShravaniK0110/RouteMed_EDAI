'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  LayoutDashboard,
  Truck,
  Building2,
  Ambulance,
  Users
} from 'lucide-react'

const adminLinks = [
  {
    name: 'Overview',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Paramedics',
    href: '/admin/paramedics',
    icon: Truck,
  },
  {
    name: 'Hospitals',
    href: '/admin/hospitals',
    icon: Building2,
  },
  {
    name: 'Rides',
    href: '/admin/rides',
    icon: Ambulance,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-[#1f1a17] border-r border-white/10 text-white flex flex-col">
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-red-600 flex items-center justify-center text-xs font-black">
            RM
          </div>

          <div>
            <h1 className="text-lg font-black tracking-tight">
              RouteMed
            </h1>

            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.22em]">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {adminLinks.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                active
                  ? 'bg-[#b86b52] text-white shadow-lg shadow-black/20'
                  : 'text-white/55 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />

              <span className="text-sm">
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-5 border-t border-white/10">
        <Link
          href="/"
          className="text-xs text-white/35 hover:text-white transition-colors uppercase tracking-[0.2em]"
        >
          ← Exit
        </Link>
      </div>
    </aside>
  )
}