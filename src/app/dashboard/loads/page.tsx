"use client";
import Loading from "@/components/ui/Loading";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Pencil,MapPin,Trash2,X,UserRoundMinus, Info } from "lucide-react";
import { Select,SelectTrigger,SelectContent,SelectItem,SelectValue, } from "@/components/ui/select";
import Link from "next/link";
import CreateLoadModal from "@/components/dashboard/CreateLoadModal";
import LoadDetailsModal from "@/components/dashboard/LoadDetailsModal";
import { TooltipProvider,Tooltip,TooltipTrigger,TooltipContent } from "@/components/ui/tooltip";
import {Load} from "@/types"

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoad, setShowLoad] = useState(false);
  const [showDetails, setShowsDetails] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null)
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter ] = useState("all");


  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentLoad, setCurrentLoad] = useState<Partial<Load> | null>(null);

  const fetchLoads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("loads")
      .select(`
        *,
        drivers:driver_id(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching loads:", error);
      toast.error("Failed to fetch loads");
    } else {
      setLoads(data || []);
      setFilteredLoads(data || []);
    }
    setLoading(false);
  };

  // Apply Filter
  const applyFilters = () => {
    let filtered = loads;

    // Apply search
    if (searchTerm.trim()){
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (load) =>
          String(load.load_number ?? "").toLowerCase().includes(term) ||
          String(load.pickup_location ?? "").toLowerCase().includes(term) ||
          String(load.delivery_location ?? "").toLowerCase().includes(term) ||
          String(load.drivers?.full_name ?? "").toLowerCase().includes(term)
      );
    }

    //Applying status Filter
    if(statusFilter !== "all"){
      filtered = filtered.filter((load) => load.status === statusFilter);
    }
    setFilteredLoads(filtered);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFilteredLoads(loads);
  };

  
  useEffect(() => {
    fetchLoads();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("loads").delete().eq("id", id);
    if (!error) {
      toast.success("Load Deleted Successfully");
      fetchLoads();
    } else {
      toast.error("Failed to delete load");
    }
  };

  const handleRefresh = async (id: string) => {
    const { error } = await supabase.from("loads").update({ driver_id: null }).eq("id", id);
    if (!error) {
      toast.success("Load Unassigned Successfully");
      fetchLoads();
    } else {
      toast.error("Failed to unassign load");
    }
  };

  const handleEdit = (load: Load) => {
    setCurrentLoad(load);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentLoad) return;

    const { error } = await supabase
      .from("loads")
      .update({
        load_number: currentLoad.load_number,
        pickup_location: currentLoad.pickup_location,
        delivery_location: currentLoad.delivery_location,
        pallets: currentLoad.pallets,
        commodity: currentLoad.commodity,
        pickup_datetime: currentLoad.pickup_datetime,
        delivery_datetime: currentLoad.delivery_datetime
      })
      .eq("id", currentLoad.id);

    if (!error) {
      toast.success("Load updated successfully");
      setEditModalOpen(false);
      fetchLoads();
    } else {
      toast.error("Failed to update load");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold mb-6">Loads</h2>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex gap-2">
                <button onClick={()=>setShowLoad(true)} className="px-4 py-2 bg-black text-white rounded tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg">New Load</button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Create Load</TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center ">
        {/* Search Box */}
        <div className="flex w-full md:w-1/2 items-center border rounded px-2">
          <input placeholder="Search" value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)}
          className="border-0 flex-1 focus:ring-0"/>
          {searchTerm && (
            <Button variant="ghost" size={"icon"} onClick={clearSearch}
            className="text-gray-500 hover:text-black">
              <X className="h-4 w-4" />
            </Button>
      
          )}
          <Button variant="ghost" size={"icon"} onClick={applyFilters} className="text-gray-500 hover:text-black">
            <search className="w-4 h-4"/>
          </Button>
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="In Transit">In Transit </SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={applyFilters} className="ml-2 tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg">
          Search
        </Button>
      </div>

      {loading ? (
        <Loading text="Fetching Loads"/>
      ) : filteredLoads.length === 0 ? (
        <p>No loads found.</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-6 py-3 text-sm text-left">Load No:</th>
              <th className="px-6 py-3 text-sm text-left">Pickup</th>
              <th className="px-6 py-3 text-sm text-left">Delivery</th>
              <th className="px-6 py-3 text-sm text-left">Driver</th>
              <th className="px-6 py-3 text-sm text-left">Status</th>
              <th className="px-6 py-3 text-sm text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoads.map((load) => (
              <tr key={load.id} className="border-t">
                <td className="px-6 py-3 text-sm">{load.load_number || "—"}</td>
                <td className="px-6 py-3 text-sm">{load.pickup_location || "—"}</td>
                <td className="px-6 py-3 text-sm">{load.delivery_location || "—"}</td>
                <td className="px-6 py-3 text-sm">{load.drivers?.full_name || "Unassigned"}</td>
                <td className="px-6 py-3 text-sm">{load.status || "—"}</td>
                <td className="px-6 py-3 flex gap-2">

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>      
                        <Button size="sm" variant="outline" className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg" onClick={() => handleEdit(load)}>
                          <Pencil className="text-yellow-500" size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Load</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg" onClick={() => handleRefresh(load.id)}>
                          <UserRoundMinus className="text-red-500" size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Unassign Driver</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="destructive" className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg" onClick={() => handleDelete(load.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Load</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {load.driver_id && !["Pending","Delivered","Cancelled"].includes(load.status ?? "") && (
                          <Link href={`/dashboard/map?driver=${load.driver_id}`}>
                            <Button size="sm" variant="outline" className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg">
                              <MapPin className="text-green-500" size={16} />
                            </Button>
                          </Link>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>View Location</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg" onClick={()=>{setSelectedLoad(load); setShowsDetails(true)}}>
                            <Info className="text-blue-500" size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Load Information</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Load Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Load</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            Load Number
            <Input
              className="p-2 border rounded"
              placeholder="Load Number"
              value={currentLoad?.load_number || ""}
              onChange={(e) => setCurrentLoad({ ...currentLoad, load_number: e.target.value })}
            />
            Commodity
            <Input
              className="p-2 border rounded"
              placeholder="Commodity"
              value={currentLoad?.commodity || ""}
              onChange={(e) => setCurrentLoad({ ...currentLoad, commodity: e.target.value })}
            />
            Pallets
            <Input
              className="p-2 border rounded"
              placeholder="Pallets"
              value={currentLoad?.pallets || ""}
              onChange={(e) => setCurrentLoad({ ...currentLoad, pallets: Number(e.target.value) })}
            />
            Weights
            <Input
              className="p-2 border rounded"
              placeholder="Weight"
              value={currentLoad?.weights || ""}
              onChange={(e) => setCurrentLoad({ ...currentLoad, weights:Number(e.target.value) })}
            /> 
            Pickup Location
            <Input
              className="p-2 border rounded"
              placeholder="Pickup Location"
              value={currentLoad?.pickup_location || ""}
              onChange={(e) => setCurrentLoad({ ...currentLoad, pickup_location: e.target.value })}
            />
            Delivery Location
            <Input
              className="p-2 border rounded"
              placeholder="Delivery Location"
              value={currentLoad?.delivery_location || ""}
              onChange={(e) => setCurrentLoad({ ...currentLoad, delivery_location: e.target.value })}
            />
            Pickup DateTime
            <input 
            name="Pickup Datetime"
            placeholder="Pick-Up DateTime"
            type="datetime-local" 
            className="p-2 border rounded" 
            value={currentLoad?.pickup_datetime ?? ""} 
            onChange={(e) => setCurrentLoad({ ...currentLoad,pickup_datetime: e.target.value})}
            />
            Delivery DateTime
            <input 
            name="Deivery Datetime"
            placeholder="Delivery DateTime"
            type="datetime-local" 
            className="p-2 border rounded" 
            value={currentLoad?.delivery_datetime ?? ""} 
            onChange={e=> setCurrentLoad({...currentLoad,delivery_datetime: e.target.value})}/>
          
          </div>


          <DialogFooter>
            <Button variant="outline" className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button className="tranform transmission duration-300 hover:scale-110 hover:bg-grey-50 hover: shadow-lg" onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showLoad && <CreateLoadModal onClose={()=>setShowLoad(false)} onCreated={()=>{fetchLoads()}} />}
      {showDetails && (<LoadDetailsModal open={showDetails} onClose={() => setShowsDetails(false)} load={selectedLoad}/>)}
    </div>
  );
}
