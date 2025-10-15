"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"

export function TrackingRequestsPage() {
  const audioRef = useRef<HTMLAudioElement | null >(null);

  // 👇 Realtime subscription for new requests
  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3")

    const channel = supabase
      .channel("tracking-stop-requests-admin")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tracking_stop_requests",
        },
        (payload) => {
          console.log("📡 New stop request:", payload)
          // Append new request to state
          toast.info("Tracking stop requested", {
            description: "Please confirm before ending location tracking.",
            position: "top-right",
            duration: 10000, // 7 seconds
            icon: "📍", // Optional custom icon
            style: {
              background: "#eef4ff",
              color: "#1a1a1a",
              borderRadius: "8px",
              fontWeight: "500",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }
          });

          audioRef.current?.play().catch((err)=>console.warn("Sound Play Blocked:",err))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
