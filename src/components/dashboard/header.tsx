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
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg">Dashboard</h1>
      <h1 className="font-bold text-2xl justify-center">Maxx Solutions Brokerage</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.email}</span>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
