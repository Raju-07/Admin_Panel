"use client"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

export function Header() {
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6">
      {/* Left: Dashboard Label */}
      <h1 className="font-semibold text-base sm:text-lg">Dashboard</h1>

      {/* Center: Company Name */}
      <h1 className="font-bold text-lg sm:text-xl md:text-2xl text-center whitespace-nowrap overflow-hidden text-ellipsis">
        Maxx Solutions Brokerage
      </h1>

      {/* Right: User Info + Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden sm:inline text-sm text-gray-500 truncate max-w-[120px]">
          {user?.email}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}