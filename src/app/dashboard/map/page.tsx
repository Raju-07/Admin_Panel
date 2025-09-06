"use client";

import { useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { createClient } from "@supabase/supabase-js";
import Loading from "@/components/ui/Loading";
import { url } from "inspector";

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
};

export default function MapPage() {
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
            drivers ( id, full_name )
          `);

        if (error) {
          console.error("Error fetching locations:", error.message);
          setLocations([]);
          return;
        }

        const mapped: DriverLocation[] = (data || []).map((r: any) => {
          // Normalize drivers: if array, take first element; if object or null, use as is
          const drivers =
            Array.isArray(r.drivers) ? (r.drivers[0] || null) : r.drivers ?? null;
          const name = drivers?.full_name ?? null;
          if (drivers?.id) driversMapRef.current[drivers.id] = name;
          return {
            driver_id: r.driver_id,
            latitude: r.latitude,
            longitude: r.longitude,
            updated_at: r.updated_at,
            load_id: r.load_id ?? null,
            driver_name: name,
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

  // Realtime subscription for INSERT/UPDATE/DELETE on 'locations'
  useEffect(() => {
    // ensure Realtime is enabled on Supabase dashboard for 'locations'
    const channel = supabase
      .channel("realtime:locations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "locations" },
        async (payload: any) => {
          try {
            const ev = payload.eventType; // "INSERT" | "UPDATE" | "DELETE"
            const newRow: RawLocationRow | null = payload.new ?? null;
            const oldRow: RawLocationRow | null = payload.old ?? null;

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
        // older clients may use channel.unsubscribe()
        try {
          (channel as any).unsubscribe?.();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);

  if (!isLoaded) return <Loading text="Loading Map..." />;
  if (loadingLocations) return <Loading text="Loading Locations..." />;

  // map center = first location (if any)
  const center = locations.length
    ? { lat: locations[0].latitude, lng: locations[0].longitude }
    : { lat: 20.5937, lng: 78.9629 };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Live Map</h2>
      <div className="bg-white border rounded-xl overflow-hidden">
        <GoogleMap mapContainerStyle={{ width: "100%", height: "500px" }} center={center} zoom={6}>
          {locations.map((loc) => (
            <Marker
              key={loc.driver_id}
              position={{ lat: loc.latitude, lng: loc.longitude }}
              title={`Driver: ${loc.driver_name}\n Updated: ${loc.updated_at ? new Date(loc.updated_at).toLocaleString():"--"}\n `}
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
              <th className="p-2 text-left">Lat</th>
              <th className="p-2 text-left">Lng</th>
              <th className="p-2 text-left">Updated At</th>
              <th className="p-2 text-left">Load</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.driver_id} className="border-t text-sm">
                <td className="p-2">{l.driver_name ?? l.driver_id}</td>
                <td className="p-2">{Number(l.latitude).toFixed(6)}</td>
                <td className="p-2">{Number(l.longitude).toFixed(6)}</td>
                <td className="p-2">{l.updated_at ? new Date(l.updated_at).toLocaleString() : "-"}</td>
                <td className="p-2">{l.load_id ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
