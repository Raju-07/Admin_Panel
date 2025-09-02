"use client";
import {AlertDialogTrigger,AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/Loading";
import { Pencil, Mail, Trash2, Phone, FileLock2} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AddDriverModal from "@/components/dashboard/AddDriverModal";
import { TooltipProvider,Tooltip,TooltipContent,TooltipTrigger } from "@/components/ui/tooltip";

type Driver = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  auth_user_id: string;
};


export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriver, setShowDriver] = useState(false);

    // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver |null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("drivers").select("*");
    if (!error) setDrivers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

    const handleDelete = async (id: string) => {
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (!error) {
      toast.success("Driver Deleted Successfully");
      fetchDrivers();
    } else {
      toast.error("Failed to delete Driver");
    }
  };

  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentDriver) return;

    const { error } = await supabase
      .from("drivers")
      .update({
        full_name: currentDriver.full_name,
        phone: currentDriver.phone,
        email: currentDriver.email
      })
      .eq("id", currentDriver.id);

    if (!error) {
      toast.success("Driver updated successfully");
      setEditModalOpen(false);
      fetchDrivers();
    } else {
      toast.error("Failed to update Driver");
    }
  };

return (
  <div>
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold mb-6">Drivers</h2>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-end">
                  <button  onClick={()=>setShowDriver(true)} className="px-4 py-2 bg-black text-white  rounded ">New Driver</button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Add New Driver</TooltipContent>
            </Tooltip>
          </TooltipProvider>    
    </div>
    {loading ? (
      <Loading text="Loading Drivers..."/>
    ) : (
      <table className="min-w-full bg-white rounded shadow table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Email</th>              
            <th className="p-2 text-left">Action</th>              
            <th className="p-2 text-left">Connect</th>              
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id} className="border-t hover:bg-gray-50">
              <td className="p-2 text-sm">{driver.full_name}</td>
              <td className="p-2 text-sm">{driver.phone}</td>
              <td className="p-2 text-sm">{driver.email}</td>
              <td className="px-6 py-3 flex gap-2">
              {/* Updating Driver Information */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(driver)}>
                        <Pencil className="text-yellow-600" size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Driver Info</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              {/* For Deleting Driver Account */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(driver.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Driver</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </td>

              <td className="px-6 py-3">
             {/* For Making Call */}
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="px-5" size="sm" variant="outline" onClick={() => window.location.href = `tel:${driver.phone}`}>
                          <Phone className="text-green-600" size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Make a Call</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

              {/* For E-Mail */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="px-5" size="sm" variant="outline" onClick={() => window.location.href = `mailto:${driver.email}`}>
                          <Mail className="text-blue-600" size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send Mail</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              
              {/* For sending Loggin Credential */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <FileLock2 size={16} className="text-purple-500" /> Send Credentials
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Send Login Credentials?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to send login credentials to <b>{driver.full_name}</b>?  
                          This will email them their account email and default password. 
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {                           
                              // For now simulate sending email (later you can hook with real API / SMTP)
                              const subject = encodeURIComponent("Your Maxx Tracker Account Credentials")
                              const body = encodeURIComponent(`
                                Hello ${driver.full_name},

                                Welcome to Maxx Solutions! 🚚
                                Your account has been created successfully. Please use the following credentials to log in:

                                Email: ${driver.email} 
                                Password: maxxuser@1234 

                                You can change your password after logging in.
                                We advice you to update you password 

                                Thank you for being part of Maxx Solution.
                                Let’s move loads smarter, faster, and better together. 

                                Best regards,
                                Maxx Tracker Team
                              `
                            )
                           window.location.href = `mailto:${driver.email}?subject=${subject}&body=${body}`
                          }}
                        >
                          Yes, Send
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>)}

    {/* Form for Updating Driver info without leave page */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Driver</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            Full Name
            <Input
              className="p-2 border rounded"
              placeholder="Full Name"
              value={currentDriver?.full_name || ""}
              onChange={(e) => currentDriver && setCurrentDriver({ ...currentDriver, full_name: e.target.value })}
            />
            Phone Number
            <Input
              className="p-2 border rounded"
              placeholder="Phone Number"
              value={currentDriver?.phone || ""}
              onChange={(e) => currentDriver && setCurrentDriver({ ...currentDriver, phone: e.target.value })}
            />
            Email
            <Input
              className="p-2 border rounded"
              placeholder="Pallets"
              value={currentDriver?.email || ""}
              onChange={(e) => currentDriver && setCurrentDriver({ ...currentDriver, email: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showDriver && <AddDriverModal onClose={()=>setShowDriver(false)} onCreated={()=>{fetchDrivers()}} />}
  </div>
)};
