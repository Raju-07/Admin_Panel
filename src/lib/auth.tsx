"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type UserType = {
  id: string
  email: string
  role?: string
} | null

type AuthContextType = {
  user: UserType
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          id: user.id,
          email: user.email!,
          role: (user.app_metadata as any)?.role || "driver"
        })
      }
      setLoading(false)
    }
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: (session.user.app_metadata as any)?.role || "driver"
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
