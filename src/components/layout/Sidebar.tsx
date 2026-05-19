'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ambulance as AmbulanceIcon, Home, User as UserIcon, BookOpen, MapPin, Database } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  let navItems: any[] = []
  let roleTitle = ""
  let roleTag = ""

  if (pathname.startsWith('/patient')) {
    roleTitle = "Patient"; roleTag = "Portal"
    navItems = [
      { name: 'Home', href: '/patient/home', icon: Home },
      { name: 'Book Ambulance', href: '/patient/book', icon: BookOpen },
      { name: 'Profile & Wallet', href: '/patient/profile', icon: UserIcon },
    ]
  } else if (pathname.startsWith('/paramedic')) {
    roleTitle = "Paramedic"; roleTag = "App"
    navItems = [
      { name: 'Dashboard', href: '/paramedic/home', icon: Home },
      { name: 'My Profile', href: '/paramedic/profile', icon: UserIcon },
    ]
  } else if (pathname.startsWith('/admin')) {
    roleTitle = "Admin"; roleTag = "Control"
    navItems = [
      { name: 'Overview', href: '/admin/dashboard', icon: Home },
      { name: 'Paramedics', href: '/admin/paramedics', icon: AmbulanceIcon },
      { name: 'Hospitals', href: '/admin/hospitals', icon: MapPin },
      { name: 'Database Viewer', href: '/admin/database', icon: Database },
    ]
  }

  if (!pathname.startsWith('/patient') && !pathname.startsWith('/paramedic') && !pathname.startsWith('/admin')) {
    return null
  }

  return (
    <div className="flex flex-col w-64 bg-ink h-screen text-secondary fixed left-0 top-0 shrink-0 z-50">
      <div className="px-6 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-mono font-bold">RM</span>
          </div>
          <span className="font-bold text-white tracking-tight">RouteMed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{roleTag}</span>
          <span className="text-white/20 font-mono text-[10px]">/</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary/70">{roleTitle}</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-white/40'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center justify-center w-full py-2 text-xs font-mono font-bold text-white/30 hover:text-white/60 transition-colors tracking-widest uppercase"
        >
          ← Exit
        </Link>
      </div>
    </div>
  )
}