'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ambulance as AmbulanceIcon, Home, User as UserIcon, BookOpen, Clock, Star, MapPin, Database } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  let navItems: any[] = []
  let roleTitle = "AmbulanceRoute"

  if (pathname.startsWith('/patient')) {
    roleTitle = "Patient Portal"
    navItems = [
      { name: 'Home', href: '/patient/home', icon: Home },
      { name: 'Book Ambulance', href: '/patient/book', icon: BookOpen },
      { name: 'Profile & Wallet', href: '/patient/profile', icon: UserIcon },
    ]
  } else if (pathname.startsWith('/paramedic')) {
    roleTitle = "Paramedic App"
    navItems = [
      { name: 'Dashboard', href: '/paramedic/home', icon: Home },
      { name: 'My Profile', href: '/paramedic/profile', icon: UserIcon },
    ]
  } else if (pathname.startsWith('/admin')) {
    roleTitle = "Admin Dashboard"
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
    <div className="flex flex-col w-64 bg-primary h-screen text-secondary fixed left-0 top-0 border-r border-dark/20 shrink-0 shadow-xl z-50">
      <div className="flex items-center gap-3 h-16 px-6 border-b border-dark/20 bg-primary/90">
        <AmbulanceIcon className="h-6 w-6 text-secondary" />
        <span className="text-lg font-bold text-secondary tracking-tight">{roleTitle}</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
                isActive
                  ? 'bg-accent text-white shadow-md'
                  : 'hover:bg-dark/30 text-secondary/80 hover:text-secondary'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-secondary/70'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-dark/20">
        <Link href="/" className="flex items-center justify-center w-full py-2 bg-dark/30 hover:bg-dark/50 text-sm font-medium rounded-lg text-secondary transition-colors">
          Exit App
        </Link>
      </div>
    </div>
  )
}
