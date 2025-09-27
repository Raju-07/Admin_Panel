// src/hooks/useLoadNotifications.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
// Define Load type for consistency
export type Load = {
  id: string;
  load_number: string;
  pickup_location: string;
  pickup_datetime: string;
  delivery_location: string;
  delivery_datetime: string;
  commodity: string | null;
  pallets: number | null;
  driver_id: string | null;
  status: string;
  created_at: string;
  weights: number | null;
};

export function useLoadNotifications() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deliveryaudioRef = useRef<HTMLAudioElement | null>(null);

// Fetch initial data
  useEffect(() => {
    const fetchLoads = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setLoads(data as Load[]);
      setLoading(false);
    };
    fetchLoads();
  }, []);

//subscribe to realtime
  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3");
    deliveryaudioRef.current = new Audio("/notify_delivered.mp3")

    const channel = supabase
      .channel("realtime:loads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loads" },
        (payload) => {
          console.log("Realtime change:", payload);
          

          // Notification message
          let title = "";
          let message = "";

          if (payload.eventType === "INSERT") {
            title = `📦 New Load Created`
            message = `Load: ${payload.new.load_number} has been successfully added to the system`;
            setLoads((prev) => [payload.new as Load,...prev]);
          } 
          else if (payload.eventType === "UPDATE") {
            setLoads((prev) => prev.map((l) => (l.id === payload.new.id ? (payload.new as Load):l)));
            if (payload.new.status !== payload.old.status){
              //Load is set to Pending
            if(payload.new.status === "Pending"){
              title = `   👨🏻‍✈️ Driver Unassigned`
              message = `Load ${payload.new.load_number} is now pending. No driver is assigned or the Assigned driver rejected the load.`

            }else if(payload.new.status === "Assigned"){
              title = `   👳🏻‍♂️ Driver Assinged`
              message = `Driver has accepted load ${payload.new.load_number}.It's ready to move.`

            } else if(payload.new.status === "In Transit"){
              title = `   🚚 Load In Transit`
              message = `Load: ${payload.new.load_number} is currently on the move. Keep tracking for updates.`

            }else if(payload.new.status === "Delivered"){
              toast.success(`   📦 Load Delivered`,{
            description: `Load: ${payload.new.load_number} has been successfully delivered to its destination.`,
            classNames:{
                toast: "round-xl shadow-lg border border-gray-200",
                title: "font-bold text-base",
                description: "text-sm text-gray-600"
            },})
                deliveryaudioRef.current?.play().catch((err) => console.warn("Delivery sound play blocked",err))
            }else if(payload.new.status === "Cancelled"){
              title = `   ❌ Load Cancelled`
              message = `Load: ${payload.new.load_number} has been cancelled.`
            }}else{
              console.log("Working i'm in else part if the status doesn't change")
            }
          }
           else if (payload.eventType === "DELETE") {
            title = `   🗑️ Load Deleted`
            message = `Load: ${payload.old.load_number} has been removed from the system.`;
            setLoads((prev) => prev.filter((l) => l.id !== payload.old.id));
          }

          // Show toast
          if (message.length>0){
          toast.info(title,{
            description: message,
            classNames:{
                toast: "round-xl shadow-lg border border-gray-200",
                title: "font-bold text-base",
                description: "text-sm text-gray-600"
            },
          });

          // Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => console.warn("Sound play blocked:", err));
          }}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  return {loads,loading};
}
