"use client"

import Link from "next/link"
import { Home, Map, Package, Users,LocateOffIcon, MapPinOff } from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { name: "Home", icon: Home, href: "/dashboard" },
  { name: "Live Map", icon: Map, href: "/dashboard/map" },
  { name: "Loads", icon: Package, href: "/dashboard/loads" },
  { name: "Drivers", icon: Users, href: "/dashboard/drivers" },
  { name: "Stop Track", icon: MapPinOff, href: "/dashboard/tracking-request" },
]

export function Sidebar() {
  return (
    <aside className="w-44 bg-white border-r flex flex-col">
      <div className="h-16 flex items-center justify-center font-bold text-xl border-b">
        Admin Pannel
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
