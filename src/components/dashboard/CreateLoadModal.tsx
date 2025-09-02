// src/components/dashboard/CreateLoadModal.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Load,Driver } from "@/types";


export default function CreateLoadModal({ onClose, onCreated } : { onClose: ()=>void, onCreated: (data:Load)=>void }) {
  const [loadNumber, setLoadNumber] = useState("");
  const [commodity, setCommodity] = useState("");
  const [pallets, setPallets] = useState<number | "">("");
  const [weights, setWeights] = useState<number | "">("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [pickupDatetime, setPickupDatetime] = useState("");
  const [deliveryDatetime, setDeliveryDatetime] = useState("");
  const [driverId, setDriverId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch drivers to assign (only drivers table)
  useEffect(() => {
    const fetchDrivers = async () => {
      const res = await fetch("/api/admin/list-drivers"); 
      if (res.ok) {
        const json = await res.json();
        setDrivers(json.drivers || []);
      } else {
        setDrivers([]);
      }
    };
    fetchDrivers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        load_number: loadNumber,
        pickup_location: pickupLocation,
        pickup_datetime: pickupDatetime,
        delivery_location: deliveryLocation,
        delivery_datetime: deliveryDatetime,
        commodity,
        pallets,
        weights,
        driver_id: driverId
      };
      const res = await fetch("/api/admin/create-load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error || "Failed to create load");
        return;
      }
      toast.success("Load created");
      onCreated(json);
      onClose();
    } catch (err) {
      setLoading(false)
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("Error")
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleCreate} className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Create New Load</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="p-2 border rounded" placeholder="Load number" value={loadNumber} onChange={e=>setLoadNumber(e.target.value)} required/>
          <input className="p-2 border rounded" placeholder="Commodity" value={commodity} onChange={e=>setCommodity(e.target.value)} />
          <input className="p-2 border rounded" placeholder="Pallets" value={pallets } onChange={e=>setPallets(e.target.value?Number(e.target.value):"")} />
          <input className="p-2 border rounded" placeholder="Weights" value={weights } onChange={e=>setWeights(e.target.value?Number(e.target.value):"")} />
          <input className="p-2 border rounded" placeholder="Pickup location" value={pickupLocation} onChange={e=>setPickupLocation(e.target.value)} required/>
          <input type="datetime-local" className="p-2 border rounded" value={pickupDatetime} onChange={e=>setPickupDatetime(e.target.value)} required/>
          <input className="p-2 border rounded" placeholder="Delivery location" value={deliveryLocation} onChange={e=>setDeliveryLocation(e.target.value)} required/>
          <input type="datetime-local" className="p-2 border rounded" value={deliveryDatetime} onChange={e=>setDeliveryDatetime(e.target.value)} required/>
          <select className="p-2 border rounded" value={driverId ?? ""} onChange={(e)=>setDriverId(e.target.value || null)}>
            <option value="">Assign driver</option>
            {drivers.map(d=> <option key={d.id} value={d.id}>{d.full_name ?? d.email}</option>)}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-black text-white" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
