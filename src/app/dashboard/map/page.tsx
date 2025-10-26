"use client";

import { useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { createClient } from "@supabase/supabase-js";
import Loading from "@/components/ui/Loading";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner"
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RawLocationRow = {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string | null;
  load_id?: string | null;
  drivers?: { id: string; full_name?: string } | null;
};

type DriverLocation = {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string | null;
  load_id?: string | null;
  driver_name?: string | null;
  load_number?: string | null;
  pickup_location ?: string | null;
  delivery_location ?: string | null;
  load_status ?: string | null;
};

type RawLocationWithDriver = {
  driver_id: string;
  load_id: string | null;
  latitude: number;
  longitude: number;
  updated_at: string;
  drivers: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
  loads: {load_number: string; pickup_location: string; delivery_location: string; status: string} | {load_number: string; pickup_location: string; delivery_location: string; status: string}[] | null;
};


export default function MapPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchParams = useSearchParams();
  const driverId = searchParams.get("driver"); 
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const driversMapRef = useRef<Record<string, string | null>>({}); // driver_id => name

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // Fetch initial set with driver names (if DB relation exists)
  useEffect(() => {
    let mounted = true;

    async function fetchInitial() {
      setLoadingLocations(true);
      try {
        // IMPORTANT: select from 'locations' (plural) and include related drivers
        const { data, error } = await supabase
          .from("locations")
          .select(`
            driver_id,
            latitude,
            longitude,
            updated_at,
            load_id,
            drivers ( id, full_name ),
            loads (load_number,pickup_location,delivery_location,status)
          `);

        if (error) {
          console.error("Error fetching locations:", error.message);
          setLocations([]);
          return;
        }

        const mapped: DriverLocation[] = (data as RawLocationWithDriver[]).map((r) => {
          // Normalize drivers: if array, take first element; if object or null, use as is
          const drivers = Array.isArray(r.drivers) ? (r.drivers[0] || null) : r.drivers ?? null;
          const load = Array.isArray(r.loads) ? (r.loads[0] || null ) : r.loads ?? null;
          const name = drivers?.full_name ?? null;
          if (drivers?.id) driversMapRef.current[drivers.id] = name;
          return {
            driver_id: r.driver_id,
            latitude: r.latitude,
            longitude: r.longitude,
            updated_at: r.updated_at,
            load_id: r.load_id ?? null,
            driver_name: name,
            load_number: load?.load_number ?? null,
            pickup_location: load?.pickup_location ?? null,
            delivery_location: load?.delivery_location ?? null,
            load_status: load?.status ?? null,
          };
        });

        if (mounted) setLocations(mapped);
      } catch (err) {
        console.error("Unexpected error fetching initial locations:", err);
      } finally {
        if (mounted) setLoadingLocations(false);
      }
    }

    fetchInitial();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = async (driverId: string) => {
    const { error } = await supabase.from("locations").delete().eq("driver_id", driverId);
    if (!error) {
      toast.success("Load Deleted Successfully");
    } else {
      toast.error("Failed to delete load");
    }
  };

  // Realtime subscription for INSERT/UPDATE/DELETE on 'locations'
  useEffect(() => {
    // ensure Realtime is enabled on Supabase dashboard for 'locations'
    audioRef.current = new Audio("/notify.mp3")

    const channel = supabase
      .channel("realtime:locations")
      .on<RealtimePostgresChangesPayload<RawLocationRow>>(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        async (payload) => {
          try {
            const ev = payload.eventType; // "INSERT" | "UPDATE" | "DELETE"
            const newRow: RawLocationRow | null = (payload.new as RawLocationRow | null) ?? null;
            const oldRow: RawLocationRow | null = (payload.old as RawLocationRow | null) ?? null;
            let title = ""
            let message = ""
            if (ev === "INSERT"){
              title = "Driver is being Tracking 📍🌎"
              message = "Please open the map to see the current location of the driver"
              toast.info(title,{description:message})
              audioRef.current?.play().catch((err) => console.warn("Sound play blocked:",err))
            }

            if (ev === "DELETE") {
              // remove by driver_id (since driver_id is PK)
              const removedDriverId = oldRow?.driver_id;
              if (removedDriverId) {
                setLocations((prev) => prev.filter((p) => p.driver_id !== removedDriverId));
                delete driversMapRef.current[removedDriverId];
              }
              return;
            }


            if (!newRow) return;

            // determine driver name (fast path: check cached map)
            let name = driversMapRef.current[newRow.driver_id] ?? null;

            // if name unknown, fetch it once
            if (!name) {
              const res = await supabase
                .from("drivers")
                .select("full_name")
                .eq("id", newRow.driver_id)
                .maybeSingle();
              if (!res.error && res.data) {
                name = res.data.full_name ?? null;
                driversMapRef.current[newRow.driver_id] = name;
              }
            }

            const entry: DriverLocation = {
              driver_id: newRow.driver_id,
              latitude: newRow.latitude,
              longitude: newRow.longitude,
              updated_at: newRow.updated_at ?? null,
              load_id: newRow.load_id ?? null,
              driver_name: name,
            };

            setLocations((prev) => {
              const idx = prev.findIndex((p) => p.driver_id === entry.driver_id);
              if (idx === -1) {
                // new driver location
                return [...prev, entry];
              } else {
                // update existing driver location
                const copy = [...prev];
                copy[idx] = entry;
                return copy;
              }
            });
          } catch (err) {
            console.error("Realtime handler error:", err);
          }
        }
      )
      .subscribe();
      // cleanup
      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error("removeChannel error:", err);
          // fallback if removeChannel is unavailable
          if (typeof channel.unsubscribe === "function") {
            channel.unsubscribe();
          }
        }
      };
  }, []);

  if (!isLoaded) return <Loading text="Loading Map..." />;
  if (loadingLocations) return <Loading text="Fetching Locations..." />;

  // maps center = driver Location if driverId present, else all
  const targetLocation = driverId ? locations.find((l) => l.driver_id===driverId): null;

  const center = targetLocation?
  {lat: targetLocation.latitude,lng:targetLocation.longitude}:locations.length
    ? { lat: locations[0].latitude, lng: locations[0].longitude }
    : { lat: 36.966428, lng: -95.844032};
  
  const zoomLevel = driverId ? 12:6;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Live Map</h2>
      <div className="bg-white border rounded-xl overflow-hidden">
        <GoogleMap mapContainerStyle={{ width: "100%", height: "500px" }} center={center} zoom={zoomLevel}>
          { (driverId ? locations.filter(l => l.driver_id === driverId):locations).map((loc) => (
            <Marker
              key={loc.driver_id}
              position={{ lat: loc.latitude, lng: loc.longitude }}
              title={`Driver: ${loc.driver_name}\nLoad No: ${loc.load_number} \n Status: ${loc.load_status} \n Pickup: ${loc.pickup_location} \n Delivery: ${loc.delivery_location} \nUpdated: ${loc.updated_at ? new Date(loc.updated_at).toLocaleString():"--"}`}
              label={{ text: loc.driver_name ?? "", color:"#000",fontWeight:"bold", }}
              icon={{url:"/icons/semi.png", scaledSize:new google.maps.Size(40,40), 
                labelOrigin: new google.maps.Point(20,-10)
              }}
            />
          ))}
        </GoogleMap>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Last locations</h3>
        <table className="min-w-full bg-white rounded shadow mt-3">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Driver</th>
              <th className="p-2 text-left">Load</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Lat</th>
              <th className="p-2 text-left">Lng</th>
              <th className="p-2 text-left">Updated At</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.driver_id} className="border-t text-sm">
                <td className="p-2">{l.driver_name ?? l.driver_id}</td>
                <td className="p-2">{l.load_number ?? "-"}</td>
                <td className="p-2">{l.load_status ?? "-"}</td>
                <td className="p-2">{Number(l.latitude).toFixed(6)}</td>
                <td className="p-2">{Number(l.longitude).toFixed(6)}</td>
                <td className="p-2">{l.updated_at ? new Date(l.updated_at).toLocaleString() : "-"}</td>
                <td className="p-2">
                  <Button size="sm" 
                    variant="destructive" 
                    className="tranform transmission duration-300 hover:scale-120 hover:bg-grey-50 hover: shadow-lg" 
                    onClick={() => handleDelete(l.driver_id)}>
                      <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
