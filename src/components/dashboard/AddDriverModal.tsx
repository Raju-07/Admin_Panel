// src/components/dashboard/AddDriverModal.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Driver } from "@/types";

export default function AddDriverModal({ onClose, onCreated } : { onClose: ()=>void, onCreated: (data:Driver)=>void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/create-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          // default password
          password: "maxxuser@1234"
        })
      });
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(json.error || "Failed to create driver");
        return;
      }
      toast.success("Driver created");
      setFullName(""); setPhone(""); setEmail("");
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
      <form onSubmit={handleCreate} className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Driver</h3>
        <div className="space-y-3">
          <input className="w-full p-2 border rounded" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} required/>
          <input className="w-full p-2 border rounded" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} required/>
          <input className="w-full p-2 border rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} type="email" required/>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-black text-white" disabled={loading}>
            {loading ? "Creating..." : "Add Driver"}
          </button>
        </div>
      </form>
    </div>
  );
}
