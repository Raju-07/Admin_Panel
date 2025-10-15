"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from "@/components/ui/alert-dialog"
import Loading from "@/components/ui/Loading"
import { MapPinOff } from "lucide-react"

type Request = {
  id: string
  approved: boolean
  requested_at: string
  drivers: { id: string; full_name: string; phone: string } | null
  loads: { id: string; load_number: string; pickup_location: string; delivery_location: string; status: string } | null
}

export default function TrackingRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  // 👇 Realtime subscription for new requests
  useEffect(() => {
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
          console.log("📡 New stop request:")
          fetchRequests();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("tracking_stop_requests")
      .select(`
        id,
        approved,
        requested_at,
        drivers:driver_id ( id, full_name, phone ),
        loads:load_id ( id, load_number, pickup_location, delivery_location, status )
      `)
      .order("requested_at", { ascending: false })

    if (error) {
      toast.error("Failed to fetch requests")
    } else if (data) {
      // data contains nested relation arrays — cast to Request[]
      setRequests(data as unknown as Request[])
    }
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("tracking_stop_requests")
      .update({ approved: true })
      .eq("id", id)

    if (error) {
      toast.error("Failed to approve request")
    } else {
      toast.success("Tracking stopped for driver")
      fetchRequests() // refresh table
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Tracking Stop Requests</h2>

      {loading ? (
        <Loading text="Loading..." />
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No stop requests found.</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-sm text-left-sm">Load</th>
              <th className="p-2 text-sm text-left-sm ">Origin</th>
              <th className="p-2 text-sm text-left-sm">Destination</th>
              <th className="p-2 text-sm text-left-sm">Driver</th>
              <th className="p-2 text-sm text-left-sm">Status</th>
              <th className="p-2 text-sm text-left-sm">Requested At</th>
              <th className="p-2 text-sm text-left-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-t">
                {/* Unwrap the first element of the loads/drivers arrays (if present) */}
                <td className="p-2 text-sm">{req.loads?.load_number || "N/A"}</td>
                <td className="p-2 text-sm">{req.loads?.pickup_location || "-"}</td>
                <td className="p-2 text-sm">{req.loads?.delivery_location || "-"}</td>
                <td className="p-2 text-sm">{req.drivers?.full_name || "Unknown"}</td>
                <td className="p-2 text-sm">{req.loads?.status || "-"}</td>
                <td className="p-2 text-sm">{new Date(req.requested_at).toLocaleString()}</td>
                <td className="p-2 text-sm">
                  {req.approved ? (
                    <span className="text-green-600 font-medium">Approved</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg"
                      onClick={() => setConfirmId(req.id)}
                    >
                      <MapPinOff className="text-white-800" />
                      Approve
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* AlertDialog for confirmation */}
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Tracking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop tracking this driver for the selected load. Are you sure you want to approve?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && handleApprove(confirmId)}>
              Yes, Stop Tracking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
