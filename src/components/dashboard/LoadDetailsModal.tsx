"use client"
import { Dialog, DialogContent,DialogHeader,DialogDescription,DialogTitle } from "@/components/ui/dialog"
import { Load } from "@/types"

type LoadDetailsModalProps = {
    open: boolean
    onClose: ()=> void
    load: Load | null
}

export default function LoadDetailsModal({open,onClose,load}:LoadDetailsModalProps) {
    if (!load) return null
    return(
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Load Details</DialogTitle>
                    <DialogDescription>Complete information about this load.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                        <p className="font-semibold">Load Number:</p>
                        <p>{load.load_number}</p>

                        <p className="font-semibold">Commodity:</p>
                        <p>{load.commodity || "N/A"}</p>

                        <p className="font-semibold">Pallets:</p>
                        <p>{load.pallets || "N/A"}</p>

                        <p className="font-semibold">Weight:</p>
                        <p>{load.weights ? `${load.weights} Lbs.` : "N/A"}</p>

                        <p className="font-semibold">Pickup:</p>
                        <p>{load.pickup_location}</p>
                       
                        <p className="font-semibold">Pickup Time:</p>
                        <p>{load.pickup_datetime ? new Date(load.pickup_datetime).toLocaleString():"--"}</p>

                        <p className="font-semibold">Delivery:</p>
                        <p>{load.delivery_location}</p>

                        <p className="font-semibold">Delivery Time:</p>
                        <p>{load.delivery_location ? new Date(load.delivery_datetime).toLocaleString():"--"}</p>

                        <p className="font-semibold">Driver:</p>
                        <p>{load.drivers?.full_name || "Unassigned"}</p>

                        <p className="font-semibold">Status:</p>
                        <p>{load.status}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
