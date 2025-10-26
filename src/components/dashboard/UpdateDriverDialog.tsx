"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail } from "lucide-react"

type Driver = {
  id: string
  full_name: string
  phone: string
  email: string
}

type UpdateDriverDialogProps = {
  open: boolean
  onClose: () => void
  loadId: string
  currentDriver?: Driver | null
  onUpdated?:()=> void
}

export default function UpdateDriverDialog({
  open,
  onClose,
  loadId,
  currentDriver,
  onUpdated
}: UpdateDriverDialogProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string>("")

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase.from("drivers").select("id,full_name, phone, email") 
      if (error) {
        toast.error("Failed to fetch drivers")
      } else {
        setDrivers(data || [])
      }
    }
    fetchDrivers()
  }, [])

  const handlePending = async () => {
    if (!selectedDriver) {
      toast.error("Please select a driver")
      return
    }else{
        
    }

    const { error } = await supabase
      .from("loads")
      .update({ driver_id: selectedDriver, status: "Pending" })
      .eq("id", loadId)

    if (error) {
      toast.error("Failed to update driver")
    } else {
      toast.success("Driver updated successfully")
      onClose()
      if(onUpdated){
        onUpdated()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {currentDriver ? `Current Driver: ${currentDriver.full_name}` : "Assign Driver"}
          </DialogTitle>
          <DialogDescription>
            {currentDriver
              ? `${currentDriver.phone} || ${currentDriver.email}`
              : "Select a driver to assign this load."}
          </DialogDescription>
        </DialogHeader>

        {currentDriver && (
          <div className="flex gap-4 mb-4">
            <Button size="lg" className="flex-1" asChild>
              <a href={`tel:${currentDriver.phone}`}><Phone className="mr-2 h-4 w-4" /> Call</a>
            </Button>
            <Button size="lg" className="flex-1" variant="outline" asChild>
              <a href={`mailto:${currentDriver.email}`}><Mail className="mr-2 h-4 w-4" /> Email</a>
            </Button>
          </div>
        )}

        <div>
          <label className="block mb-2 font-medium">Assign New Driver</label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select a driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button onClick={handlePending}>Update Driver</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
