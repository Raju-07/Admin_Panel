"use client"
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner"
import Link from "next/link";
import { useEffect, useState } from "react";
import AddDriverModal from "@/components/dashboard/AddDriverModal";
import CreateLoadModal from "@/components/dashboard/CreateLoadModal";
import { MapPin, Info, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider,Tooltip,TooltipTrigger,TooltipContent } from "@/components/ui/tooltip";
import LoadDetailsModal from "@/components/dashboard/LoadDetailsModal";
import UpdateDriverDialog from "@/components/dashboard/UpdateDriverDialog";
import { Select,SelectTrigger,SelectContent,SelectItem,SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from "@/components/ui/alert-dialog";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import Loading from "@/components/ui/Loading";
import { Load} from "@/types";

type Metrics = {
  ongoing: number
  total: number
  delivered: number
  pending: number
  cancel : number
}

export default function DashboardHome() {
  const [showDriver, setShowDriver] = useState(false);
  const [showDetails, setShowsDetails] = useState(false)
  const [showUpdateDriver, setShowUpdateDriver] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, loadId?:string, newStatus?: string}>({open: false})
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [showLoad, setShowLoad] = useState(false);
  const [pending, setPending] = useState<Load[]>([])
  const [assigned, setAssigned] = useState<Load[]>([])
  const [inTransit, setInTransit] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics,setMetrics] = useState<Metrics>({
    ongoing: 0,
    total: 0,
    delivered: 0,
    pending: 0,
    cancel: 0,
  })
  
  //Fetching all loads
  const fetchLoads = async() => {
    setLoading(true)
    const {data, error} = await supabase.from("loads").select("id,load_number,pickup_location,delivery_location,pickup_datetime,delivery_datetime,status,drivers(id,full_name,phone,email),driver_id,commodity,pallets,weights").order("created_at",{ascending:false})

    if (error){
      toast.error("Error fetching loads")
      setLoading(false)
      return
    }
    if (data) {
      // Map drivers array to a single DriverRef (or null)
      const mappedData = data.map(l => ({
        ...l,
        drivers: Array.isArray(l.drivers) ? (l.drivers[0] || null) : l.drivers
      }));
      setPending(mappedData.filter(l => l.status === "Pending"))
      setAssigned(mappedData.filter(l => l.status === "Assigned"))
      setInTransit(mappedData.filter(l => l.status === "In Transit"))
    }
    setLoading(false)
  }

  const fetchMetrics = async() => {
    //fetch all loads
    const {data,error} = await supabase.from("loads").select("status")
    if(error){
      toast.error("Failed to fetch the loads")
    }
    if (!data) return

    const total = data.length
    const delivered = data.filter(l => l.status === "Delivered").length
    const pending = data.filter(l => l.status === "Pending").length
    const ongoing = data.filter(l => l.status === "Assigned" || l.status === "In Transit").length
    const cancel = data.filter(l => l.status  === "Cancelled" || l.status === "Cancelled").length
    setMetrics({total,delivered,pending,ongoing,cancel})
  }
  useEffect(() => {
      fetchLoads()
      fetchMetrics()
    },[])

  // Listen for realtime changes in loads
  useEffect(() => {
    const channel = supabase
      .channel("loads-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "loads"
        },
        (payload) => {
          console.log("Payload of Web app deshboard")
          console.log("Realtime change:", payload);

          // Refresh both loads and metrics
          fetchLoads();
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const handleUpdateStatus = async (loadId: string, newStatus: string) => {
    try{
      const {error} = await supabase.from("loads").update({status:newStatus}).eq("id",loadId)

     if (error) throw error
      toast.success(`Load updated to "${newStatus}"`)
      //Refreshing UI
      setPending(prev => prev.filter(l => l.id !== loadId))
      setAssigned(prev => prev.filter(l => l.id !== loadId))
      setInTransit(prev => prev.filter(l => l.id !== loadId))

      //Refetching Everythig cleanly
    } catch(_err){
      console.log("failed to update the load status",_err)
      toast.error('Failed to update load status' )
    }
  }

  const renderTable = (title: string, loads: Load[]) => (
    <div className="mb-10">
      <h2 className="text-base font-bold mb-4">{title}</h2>
      {loads.length===0?(
        <p className="text-gray-500">No Loads.</p>
      ):(
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Load</th>
              <th className="p-2 text-left">Origin</th>
              <th className="p-2 text-left">Destination</th>
              <th className="p-2 text-left">Driver</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Update Status</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loads.map(load => (
              <tr key={load.id} className="border-t">
                <td className="p-2">{load.load_number}</td>
                <td className="p-2">{load.pickup_location}</td>
                <td className="p-2">{load.delivery_location}</td>
                <td className="p-2">{load.drivers?.full_name || "Unassigned"}</td>
                <td className="p-2">{load.status} </td>
                <td className="p-2">{["Assigned","In Transit"].includes(load.status ?? "")&&(
                    <Select onValueChange={(value)=>{
                      if (value === "Delivered" || value === "Cancelled"){
                        setConfirmDialog({open:true,loadId:load.id,newStatus: value})
                      }else {
                        handleUpdateStatus(load.id,value)
                      }
                  }}>
                  <SelectTrigger className="w-[140px] transform transmission duration-300 hover:scale-105 hover:shadow-lg">
                    <SelectValue placeholder="Update status"/>
                      </SelectTrigger>
                      <SelectContent>
                        {load.status === "Assigned" && (
                          <>
                          <SelectItem value="In Transit">In Transit</SelectItem>
                        < SelectItem value="Cancelled">Cancelled</SelectItem>
                          </>
                        )}
                      {load.status === "In Transit" && (
                        <>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  )}
                </td>
                <td className="p-2 flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {load.driver_id && !["Pending","Delivered","Cancelled"].includes(load.status ?? "") && (
                        <Link href={`/dashboard/map?driver=${load.driver_id}`}>
                          <Button size="sm" className="tranform transmission duration-300 hover:scale-115 hover:bg-grey-50 hover: shadow-lg" variant="secondary">
                            <MapPin className="text-green-500" size={16} />
                          </Button>
                        </Link>)
                        }
                      </TooltipTrigger>
                      <TooltipContent>
                        View Location
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant= "outline" className="tranform transmission duration-300 hover:scale-115 hover:bg-grey-50 hover: shadow-lg" onClick={()=>{setSelectedLoad(load);setShowsDetails(true);}}>
                          <Info className="text-blue-500" size={16}/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Load Information
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant= "outline" className="tranform transmission duration-300 hover:scale-115 hover:bg-grey-50 hover: shadow-lg" onClick={()=>{setSelectedLoad(load);setShowUpdateDriver(true);}} >
                          <UserRound className="text-black-500" size={16}/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Assign Driver
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({...confirmDialog, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>If this load is marked as <b>{confirmDialog.newStatus}</b>,location tracking will be stopped</AlertDialogDescription>
          </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={()=> {
            if (confirmDialog.loadId && confirmDialog.newStatus){
              handleUpdateStatus(confirmDialog.loadId,confirmDialog.newStatus)
            }
            setConfirmDialog({open:false})}
          }>
          Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Overview</h2>
        <div className="flex gap-2">

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowLoad(true)}
                  className="px-4 py-2 bg-black text-white rounded transform duration-300 hover:scale-110 w-full sm:w-auto">
                  New Load
                </button>
              </TooltipTrigger>
              <TooltipContent>Create new Load</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowDriver(true)}
                  className="px-4 py-2 bg-black text-white border rounded transform duration-300 hover:scale-110 w-full sm:w-auto">
                  Add Driver
                </button>
              </TooltipTrigger>
              <TooltipContent>Add New Driver</TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Cards 1-5 for showing Load info */}

        <div className="bg-white shadow-lg rounded-lg p-4 transform transition duration-300 hover:scale-110 hover:bg-green-100">
          <h3 className="text-sm text-green-400">Ongoing Loads</h3>
          <p className="text-2xl text-green-400 font-bold">{metrics.ongoing}</p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-4 transform transition duration-300 hover:scale-110 hover:bg-blue-100">
          <h3 className="text-sm text-blue-500">Total Loads</h3>
          <p className="text-2xl text-blue-500 font-bold">{metrics.total}</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-4 transform transition duration-300 hover:scale-110 hover:bg-green-300">
          <h3 className="text-sm text-green-800">Delivered Loads</h3>
          <p className="text-2xl text-green-800 font-bold">{metrics.delivered}</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-4 transform transition duration-300 hover:scale-110 hover:bg-yellow-100">
          <h3 className="text-sm text-yellow-500">Pending Loads</h3>
          <p className="text-2xl text-yellow-500 font-bold">{metrics.pending}</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-4 transform transition duration-300 hover:scale-110 hover:bg-red-100">
          <h3 className="text-sm text-red-500">Cancel Loads</h3>
          <p className="text-2xl text-red-500 font-bold">{metrics.cancel}</p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-6 py-2">Loads</h1>
        {loading?(
          <Loading text="Fetching Loads..."/>
        ):(
          <>
          {renderTable("Pending Loads",pending)}
          {renderTable("Assigned Loads",assigned)}
          {renderTable("In Transit",inTransit)}
          </>
        )}
      </div>


      {showDriver && <AddDriverModal onClose={()=>setShowDriver(false)} onCreated={()=>{fetchLoads()}} />}
      {showLoad && <CreateLoadModal onClose={()=>setShowLoad(false)} onCreated={()=>{fetchLoads()}} />}
      {showDetails && (<LoadDetailsModal open={showDetails} onClose={()=> setShowsDetails(false)} load={selectedLoad}/>)}
      {showUpdateDriver && (<UpdateDriverDialog open={showUpdateDriver} onClose={()=> setShowUpdateDriver(false)}
      loadId={selectedLoad?.id ?? ""}
      currentDriver={
        selectedLoad?.drivers && selectedLoad.driver_id
          ? {
              id: selectedLoad.driver_id ?? "",
              full_name: selectedLoad.drivers.full_name ?? "",
              phone: selectedLoad.drivers.phone ?? "",
              email: selectedLoad.drivers.email ?? ""
            }
          : null
      } onUpdated={()=>{fetchLoads()}}
      
  />
  )}

    </div>
  );
}
