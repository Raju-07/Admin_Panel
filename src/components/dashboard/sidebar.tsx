"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, Package, Users, MapPinOff } from "lucide-react"

const menuItems = [
  { name: "Home", icon: Home, href: "/dashboard" },
  { name: "Live Map", icon: Map, href: "/dashboard/map" },
  { name: "Loads", icon: Package, href: "/dashboard/loads" },
  { name: "Drivers", icon: Users, href: "/dashboard/drivers" },
  { name: "Stop Track", icon: MapPinOff, href: "/dashboard/tracking-request" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="group w-17 hover:w-44 bg-white border-r flex flex-col transition-all duration-300">
      {/* Top Logo/Title */}
      <div className="h-16 flex items-center justify-center font-bold text-xl border-b">
        <span className="hidden group-hover:block">Admin Panel</span>
        <span className="block group-hover:hidden">☰</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all
                ${isActive 
                  ? "bg-blue-200 text-blue-900 font-medium" 
                  : "text-gray-700 hover:bg-gray-100"}`
              }
            >
              <item.icon
                className={`flex-shrink-0 transition-all duration-300 
                  ${isActive ? "w-5 h-5 text-blue-600" : "w-5 h-5"}`}
              />
              <span className="hidden group-hover:inline">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
