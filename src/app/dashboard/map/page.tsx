"use client"

import { useEffect, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { createClient } from "@supabase/supabase-js"
import Loading from "@/components/ui/Loading"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type DriverLocation = {
  id: string
  driver_id: string
  latitude: number
  longitude: number
}

export default function MapPage() {
  const [locations, setLocations] = useState<DriverLocation[]>([])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  // Fetch initial locations
  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from("location").select("*")
      if (!error && data) setLocations(data as DriverLocation[])
    }
    fetchLocations()
  }, [])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("realtime:location")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "location" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLocations((prev) => [...prev, payload.new as DriverLocation])
          }
          if (payload.eventType === "UPDATE") {
            setLocations((prev) =>
              prev.map((loc) =>
                loc.id === (payload.new as DriverLocation).id
                  ? (payload.new as DriverLocation)
                  : loc
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (!isLoaded) return <Loading text="Loading Map..."/>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Live Map</h2>
      <div className="bg-white border rounded-xl overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "500px" }}
          center={
            locations.length > 0
              ? { lat: locations[0].latitude, lng: locations[0].longitude }
              : { lat: 20.5937, lng: 78.9629 } // India center
          }
          zoom={5}
        >
          {locations.map((loc) => (
            <Marker
              key={loc.id}
              position={{ lat: loc.latitude, lng: loc.longitude }}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  )
}
